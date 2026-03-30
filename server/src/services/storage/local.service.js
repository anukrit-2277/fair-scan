const fs = require('fs');
const path = require('path');

const deleteFile = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      return true;
    }
    return false;
  } catch (err) {
    console.error(`Failed to delete file: ${filePath}`, err.message);
    return false;
  }
};

const getFileSize = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
};

const readFileContent = async (filePath, encoding = 'utf-8') => {
  return fs.promises.readFile(filePath, encoding);
};

const fileExists = (filePath) => fs.existsSync(filePath);

const getRelativePath = (absolutePath) => {
  const uploadsIndex = absolutePath.indexOf('uploads');
  if (uploadsIndex === -1) return absolutePath;
  return absolutePath.slice(uploadsIndex);
};

module.exports = { deleteFile, getFileSize, readFileContent, fileExists, getRelativePath };
