const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

const uploadToCloudinary = async (fileBuffer, folder = 'restaurant-pos') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
    return `https://placehold.co/400x300?text=Food`;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) reject(new ApiError(500, 'Image upload failed'));
        else resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

const uploadMultiple = async (files, folder = 'restaurant-pos') => {
  const uploads = files.map((file) => uploadToCloudinary(file.buffer, folder));
  return Promise.all(uploads);
};

module.exports = { uploadToCloudinary, uploadMultiple };
