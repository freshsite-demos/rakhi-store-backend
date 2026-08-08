import cloudinary from '../config/cloudinary';

export const uploadImageToCloudinary = async (fileBuffer: Buffer): Promise<string> => {
  if (!cloudinary.config().cloud_name) {
    console.warn('Cloudinary not configured. Returning local fallback placeholder image URL.');
    return 'https://images.unsplash.com/photo-1627916503930-b3e34b17a10a?w=600&auto=format&fit=crop&q=60';
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'rakhi_store' },
      (error, result) => {
        if (error || !result) {
          return reject(error || new Error('Upload to Cloudinary failed'));
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};
