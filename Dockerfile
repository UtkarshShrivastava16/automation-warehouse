# Choose the base image for your function app
FROM mcr.microsoft.com/azure-functions/node:4-node18

# Set the working directory
WORKDIR /home/site/wwwroot

# Copy package.json and package-lock.json into the image
COPY package*.json ./

# Install npm packages
RUN npm ci

# Copy the rest of the function app's files
COPY . .

# Expose the functions port
ENV AzureWebJobsScriptRoot=/home/site/wwwroot
ENV AzureFunctionsJobHost__Logging__Console__IsEnabled=true

# Expose the required port
EXPOSE 80
