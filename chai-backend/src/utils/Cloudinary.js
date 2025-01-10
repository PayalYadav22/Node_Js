import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuring Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Uploads a file to Cloudinary and deletes the local file afterward.
 * @param {string} localFilePath - The path to the local file to be uploaded.
 * @returns {Promise<string|null>}
 */
const uploadOnCloudinary = async (localFilePath) => {
    if (!localFilePath) {
        console.error("No file path provided.");
        return null;
    }

    console.log("Received file path:", localFilePath);

    try {
        // Upload the file to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" // Automatically detect file type
        });

        console.log(`File uploaded successfully to Cloudinary: ${response.secure_url}`);
        return response.secure_url; // Return the uploaded file's secure URL

    } catch (error) {
        console.error("Error uploading file to Cloudinary:", error);
        return null;

    } finally {
        // Delete the local temporary file
        try {
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
                console.log("Temporary file deleted successfully.");
            } else {
                console.log("Temporary file not found, nothing to delete.");
            }
        } catch (deleteError) {
            console.error("Error deleting temporary file:", deleteError);
        }
    }
};

export { uploadOnCloudinary };
