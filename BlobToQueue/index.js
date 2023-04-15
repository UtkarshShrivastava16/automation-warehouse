const { QueueServiceClient } = require('@azure/storage-queue');

module.exports = async function (context, myBlob) {
    const connectionString = process.env['AzureWebJobsStorage'];
    const queueName = "warehouse-image-queue"; 

    // Create a QueueServiceClient using the connection string
    const queueServiceClient = QueueServiceClient.fromConnectionString(connectionString);

    // Get a reference to the queue
    const queueClient = queueServiceClient.getQueueClient(queueName);

    // Create the queue if it doesn't exist
    await queueClient.createIfNotExists();

    // Get the path of the uploaded blob from the context
    const blobPath = context.bindingData.blobTrigger;

    // Add the blob path as a message to the queue
    await queueClient.sendMessage(Buffer.from(JSON.stringify({ blobPath })).toString('base64'));

    context.log(`Blob trigger function processed blob \n Path: ${blobPath} \n Size: ${myBlob.length} Bytes`);
};