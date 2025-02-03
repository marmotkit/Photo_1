const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob');

let blobServiceClient;
let containerClient;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'photo-album';

const initializeStorage = async () => {
  try {
    console.log('正在初始化 Azure Storage...');
    
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      throw new Error('未設定 AZURE_STORAGE_CONNECTION_STRING');
    }
    
    blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
    console.log('已創建 BlobServiceClient');
    
    containerClient = blobServiceClient.getContainerClient(containerName);
    console.log(`正在檢查容器 ${containerName} 是否存在...`);
    
    const exists = await containerClient.exists();
    if (!exists) {
      console.log(`創建容器 ${containerName}...`);
      await containerClient.create();
      console.log('容器創建成功');
    } else {
      console.log('容器已存在');
    }
    
    console.log('Azure Storage 初始化完成');
  } catch (error) {
    console.error('Azure Storage 初始化失敗:', error);
    // 不要拋出錯誤，讓應用程式可以繼續運行
    // 之後可以在需要時重試連接
  }
};

// 生成 SAS URL
const generateSasUrl = (blobName) => {
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME || 'photoalbumstore';
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  
  const startsOn = new Date();
  const expiresOn = new Date(new Date().valueOf() + (24 * 60 * 60 * 1000)); // 24小時後過期
  
  const sasOptions = {
    containerName,
    blobName,
    permissions: BlobSASPermissions.parse("r"), // 只讀權限
    startsOn,
    expiresOn,
  };
  
  const sasToken = generateBlobSASQueryParameters(
    sasOptions,
    sharedKeyCredential
  ).toString();
  
  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
};

const uploadFile = async (file, customFileName = null) => {
  try {
    const fileName = customFileName || `${Date.now()}-${file.originalname}`;
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    
    // 如果文件是 Buffer
    if (Buffer.isBuffer(file.buffer)) {
      await blockBlobClient.upload(file.buffer, file.buffer.length);
    } 
    // 如果文件是本地文件路徑
    else {
      await blockBlobClient.uploadFile(file.path);
    }
    
    return {
      url: generateSasUrl(fileName),
      name: fileName
    };
  } catch (error) {
    console.error(`Error uploading file: ${error.message}`);
    throw error;
  }
};

const deleteFile = async (fileName) => {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.delete();
  } catch (error) {
    console.error(`Error deleting file: ${error.message}`);
    throw error;
  }
};

module.exports = {
  initializeStorage,
  uploadFile,
  deleteFile,
  generateSasUrl
}; 