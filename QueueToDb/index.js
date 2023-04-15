const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
const { ApiKeyCredentials } = require('@azure/ms-rest-js');
const { CosmosClient } = require('@azure/cosmos');
const { BlobServiceClient } = require('@azure/storage-blob');

module.exports = async function (context, myQueueItem) {
    const visionKey = process.env['VISION_API_KEY'];
    const visionEndpoint = process.env['VISION_API_ENDPOINT'];
    const cosmosDbConnectionString = process.env['COSMOS_DB_CONNECTION_STRING'];
    const databaseId = "image-texts"; // Replace with your Cosmos DB database ID
    const containerId = "image-texts"; // Replace with your Cosmos DB container ID
    const blobConnectionString = process.env['AzureWebJobsStorage'];

    // Initialize the BlobServiceClient
    const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);

    // Get blob path from the queue message
    
    const blobPath  = myQueueItem.blobPath;

    const [containerName, ...blobNameParts] = blobPath.split('/');
    const blobName = blobNameParts.join('/');

    context.log('Blob path:', blobPath);
    context.log('Container name:', containerName);
    context.log('Blob name:', blobName);

    // Get a reference to the container and the blob
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Download the blob content
    const response = await blockBlobClient.download();
    const imageBuffer = await streamToBuffer(response.readableStreamBody);

    // Initialize the Computer Vision client
    const credentials = new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': visionKey } });
    const computerVisionClient = new ComputerVisionClient(credentials, visionEndpoint);

    // Perform OCR using the Vision API
    const result = await computerVisionClient.recognizePrintedTextInStream(true, imageBuffer);

    // Extract the text from the Vision API result
    const extractedText = result.regions
        .map(region => region.lines.map(line => line.words.map(word => word.text).join(' ')).join('\n'))
        .join('\n');

    // Initialize the Cosmos DB client
    const cosmosClient = new CosmosClient(cosmosDbConnectionString);
    const container = cosmosClient.database(databaseId).container(containerId);

    // Insert the extracted text into Cosmos DB
    await container.items.create({ id: context.bindingData.id, text: extractedText });

context.log('Text extracted:', extractedText);
};

async function streamToBuffer(readableStream) {
return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on('data', (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
    });
    readableStream.on('end', () => {
        resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
});
}