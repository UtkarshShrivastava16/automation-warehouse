const { BlobServiceClient } = require('@azure/storage-blob');
const multipart = require('parse-multipart');

module.exports = async function (context, req) {
  // Get the connection string and container name from app settings
  const connectionString = process.env['AzureWebJobsStorage'];
  const containerName = process.env['ContainerName'];

  // Create a BlobServiceClient object from the connection string
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

  // Get a reference to the container
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Create the container if it doesn't already exist
  await containerClient.createIfNotExists();

  // Get the image file from the multipart form data
  const bodyBuffer = Buffer.from(req.body);
  const boundary = multipart.getBoundary(req.headers['content-type']);
  const parts = multipart.Parse(bodyBuffer, boundary);
  const imageFile = parts[0];

   // Log the entire bindingData object
  //  context.log('Binding data:', JSON.stringify(context.bindingData));

  // Create a new Blob Storage block blob with a unique name
  const blobName = `${new Date().getTime()}-${imageFile.filename}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  console.log()
  // Upload the image data to the blob
  await blockBlobClient.upload(imageFile.data, imageFile.data.length);

  // Return a success response
  context.res = {
    status: 200,
    body: "Image - "+imageFile.filename +" - uploaded to the blob successfully."
  };
};
