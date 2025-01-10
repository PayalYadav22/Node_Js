import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const app = express();

// Ensure 'uploads' directory exists
const uploadDirectory = 'uploads';
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory);
    console.log('Uploads directory created.');
} else {
    console.log('Uploads directory exists.');
}

// Configure Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirectory); // Save files in the 'uploads' directory
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix); // Create unique filenames
    }
});

const upload = multer({ storage }).single('avatar');

// Upload endpoint
app.post('/uploads', (req, res) => {
    console.log('Incoming request...');
    upload(req, res, (err) => {
        if (err) {
            console.error('Upload error:', err);
            return res.status(400).send('Error uploading file.');
        }

        console.log('Request body:', req.body); // Log form data
        console.log('Uploaded file:', req.file); // Log file metadata

        if (!req.file) {
            console.log('No file found in the request.');
            return res.status(400).send('No file uploaded.');
        }

        res.status(200).json({
            message: 'File uploaded successfully!',
            file: {
                originalName: req.file.originalname,
                filename: req.file.filename,
                path: req.file.path,
                size: req.file.size
            }
        });
    });
});

// Start the server
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
