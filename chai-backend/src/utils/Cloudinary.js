import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configuring Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    console.log("Received file path !!! :", localFilePath);
    try {
        if (!localFilePath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto" 
        });
        // file has been uploaded successfull
        console.log(`file is uploaded on cloudinary !!! ${response.url}`);
        return response;
    } catch (error) {
        if (fs.unlinkSync(localFilePath)) {
            console.log("Temporary file deleted successfully.");
        } else {
            console.log("Local temporary file not found, nothing to delete.");
        }
        return null;
    }
}; 

export { uploadOnCloudinary };