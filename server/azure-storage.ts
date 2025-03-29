import { BlobServiceClient, BlockBlobClient, ContainerClient } from "@azure/storage-blob";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = "csv-uploads";
const isDevelopment = process.env.NODE_ENV !== "production";

export class AzureStorageService {
  private blobServiceClient: BlobServiceClient | null = null;
  private containerClient: ContainerClient | null = null;
  private isConnected: boolean = false;

  constructor() {
    if (connectionString) {
      try {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        this.containerClient = this.blobServiceClient.getContainerClient(containerName);
        this.isConnected = true;
        
        // Ensure the container exists
        this.ensureContainer();
      } catch (error) {
        console.warn("Failed to connect to Azure Storage:", error);
        this.isConnected = false;
      }
    } else if (isDevelopment) {
      console.warn("Azure Storage connection string is not defined. Running in mock mode for development.");
      this.isConnected = false;
    } else {
      console.error("Azure Storage connection string is not defined in environment variables");
      this.isConnected = false;
    }
  }

  private async ensureContainer(): Promise<void> {
    if (!this.isConnected || !this.containerClient) {
      return;
    }
    
    try {
      await this.containerClient.createIfNotExists({
        access: "blob" // Public access at blob level
      });
    } catch (error) {
      console.error("Error creating container:", error);
      this.isConnected = false;
    }
  }

  private getBlockBlobClient(filename: string): BlockBlobClient | null {
    if (!this.isConnected || !this.containerClient) {
      return null;
    }
    return this.containerClient.getBlockBlobClient(filename);
  }

  async uploadFile(buffer: Buffer, originalFilename: string): Promise<string> {
    // Save file locally regardless of Azure connection
    const localFilePath = await this.saveFileLocally(buffer);
    
    if (!this.isConnected) {
      console.warn("Azure Storage not connected. File saved locally only:", localFilePath);
      return `local://${localFilePath}`;
    }
    
    try {
      const fileExtension = path.extname(originalFilename);
      const blobName = `${randomUUID()}${fileExtension}`;
      const blockBlobClient = this.getBlockBlobClient(blobName);
      
      if (!blockBlobClient) {
        throw new Error("Failed to get block blob client");
      }
      
      await blockBlobClient.upload(buffer, buffer.length);
      
      return blockBlobClient.url;
    } catch (error) {
      console.error("Error uploading file to Azure Storage:", error);
      return `local://${localFilePath}`;
    }
  }

  async downloadFile(blobName: string): Promise<Buffer> {
    if (!this.isConnected) {
      if (blobName.startsWith('local://')) {
        const localPath = blobName.replace('local://', '');
        try {
          return fs.readFileSync(localPath);
        } catch (error) {
          console.error("Error reading local file:", error);
          throw new Error("File not found");
        }
      }
      throw new Error("Azure Storage not connected and file is not local");
    }
    
    try {
      const blockBlobClient = this.getBlockBlobClient(blobName);
      
      if (!blockBlobClient) {
        throw new Error("Failed to get block blob client");
      }
      
      const response = await blockBlobClient.download(0);
      
      // Convert the stream to a buffer
      const chunks: Buffer[] = [];
      for await (const chunk of response.readableStreamBody!) {
        chunks.push(Buffer.from(chunk));
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error("Error downloading file from Azure Storage:", error);
      throw error;
    }
  }

  async deleteFile(blobName: string): Promise<void> {
    if (!this.isConnected) {
      if (blobName.startsWith('local://')) {
        const localPath = blobName.replace('local://', '');
        try {
          fs.unlinkSync(localPath);
          return;
        } catch (error) {
          console.error("Error deleting local file:", error);
          return;
        }
      }
      console.warn("Azure Storage not connected. Cannot delete file:", blobName);
      return;
    }
    
    try {
      const blockBlobClient = this.getBlockBlobClient(blobName);
      
      if (!blockBlobClient) {
        throw new Error("Failed to get block blob client");
      }
      
      await blockBlobClient.delete();
    } catch (error) {
      console.error("Error deleting file from Azure Storage:", error);
    }
  }
  
  async saveFileLocally(buffer: Buffer): Promise<string> {
    try {
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, `${randomUUID()}.csv`);
      
      fs.writeFileSync(tempFilePath, buffer);
      
      return tempFilePath;
    } catch (error) {
      console.error("Error saving file locally:", error);
      throw error;
    }
  }
}

export const azureStorage = new AzureStorageService();
