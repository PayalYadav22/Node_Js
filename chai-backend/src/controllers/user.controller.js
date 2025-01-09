import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/Cloudinary.js';

// Register user
const registerUser = asyncHandler(async (req, res) => {
    
    const { username, email, fullname, password } = req.body;
    console.log("Body:", req.body);
    console.log("Files:", req.files);

    if ([username, fullname, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required.");
    }

    const exitedUser = await User.findOne({ $or: [{ username }, { email }] })
    if (exitedUser) {
        throw new ApiError(409, "User with email or username already exists.");
    }

    const avatarLocalFile = req.files?.avatar?.[0]; 

    if (!avatarLocalFile) {
        throw new ApiError(400, "Avatar file is required.");
    }else{
        res.status(200).json({ message: " Avatar file uploaded successfully!", files: { avatar } });
    }

    const avatar = await uploadOnCloudinary(avatarLocalFile);

    if (!avatar) {
        console.log("Avatar upload failed.");
        throw new ApiError(400, "Failed to upload avatar.");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        fullName: fullname,
        email,
        avatar: avatar.url,
        password
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user.");
    }

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
