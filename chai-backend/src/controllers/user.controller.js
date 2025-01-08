import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/Cloudinary.js';

// Register user
const registerUser = asyncHandler(async (req, res) => {
    
    // Get user details from frontend
    const { username, email, fullname, password } = req.body;

    console.log(req.body)

    // Validation
    if ([username, fullname, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required.");
    }

    // Check if user already exists: username, email
    const exitedUser = await User.findOne({ $or: [{ username }, { email }] })
    if (exitedUser) {
        throw new ApiError(409, "User with email or username already exists.");
    }

    // Handle file uploads
    console.log(req.files)
    
    const avatarLocalFile = req.files?.avatar[0]?.path;
    const coverLocalImageFile = req.files?.coverImage[0]?.path;

    if (!avatarLocalFile) {
        throw new ApiError(400, "Avatar file is required.");
    }

    // Upload avatar and cover image to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalFile);
    const coverImage = coverLocalImageFile ? await uploadOnCloudinary(coverLocalImageFile) : null;

    if (!avatar) {
        console.log("Avatar upload failed.");
        throw new ApiError(400, "Failed to upload avatar.");
    }

    // Create user
    const user = await User.create({
        username: username.toLowerCase(),
        fullName: fullname,
        email,
        avatar: avatar.url,
        coverImage: coverImage?.url || "", // Handle if cover image is optional
        password
    });

    // Remove password and refresh token fields from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user.");
    }

    // Return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully.")
    );
});

// Login user
const loginUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: 'ok',
    });
});

export { registerUser, loginUser };
