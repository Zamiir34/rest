const cloudinary = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

const path = require('path');
const fs = require('fs');

const uploadToCloudinary = async (fileBuffer, folder = 'restaurant-pos') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
    try {
      const uploadsDir = path.join(__dirname, '..', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filename = `food_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, fileBuffer);
      const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;
      return `${serverUrl}/uploads/${filename}`;
    } catch (err) {
      console.error('Local upload failed:', err);
      return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80';
    }
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
