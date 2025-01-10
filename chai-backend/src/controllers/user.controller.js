import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/Cloudinary.js';
import jwt from 'jsonwebtoken'

// Generate Access and Refresh Tokens
const generateAccessAndRefreshToken = async (userId) => {
    try {
        // Step 1: Find the user by ID
        const user = await User.findById(userId);

        // Step 2: Generate access and refresh tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Step 3: Save the refresh token to the user document
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        // Step 4: Return the tokens
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, 'Error generating tokens');
    }
};

// Refresh & Access Tokens
const RefreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }
    try{
        const decoadToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decoadToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used")
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refresh"
            )
        )
    }catch(error){
        throw new ApiError(401, error?.message || "Invalid Refresh Token") 
    }
});

// Register User
const registerUser = asyncHandler(async (req, res) => {
    // Step 1: Destructure input fields and validate required fields
    const { username, email, fullName, password } = req.body;

    if ([username, fullName, email, password].some((field) => !field?.trim())) {
        throw new ApiError(400, "All fields are required.");
    }

    // Step 2: Check if the user already exists (email or username)
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists.");
    }

    // Step 3: Get uploaded file paths for avatar and cover image
    const avatarLocalFile = req.files?.avatar?.[0]?.path;
    const coverImageLocalFile = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalFile) {
        throw new ApiError(400, "Avatar file is required.");
    }

    // Step 4: Upload avatar and cover image to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalFile);
    const coverImage = coverImageLocalFile
        ? await uploadOnCloudinary(coverImageLocalFile)
        : null;

    // Step 5: Create a new user
    const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        email,
        avatar,
        coverImage,
        password,
    });

    // Step 6: Fetch the created user without sensitive fields
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Error registering user.");
    }

    // Step 7: Respond with the created user
    return res.status(201).json(new ApiResponse(201, createdUser, "User registered successfully."));
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
    // Step 1: Destructure input fields and validate required fields
    const { email, username, password } = req.body;

    if (!(username || email) || !password) {
        throw new ApiError(400, "Username or Email and Password are required.");
    }

    // Step 2: Find user by username or email
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    // Step 3: Verify the user's password
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid user credentials.");
    }

    // Step 4: Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    // Step 5: Fetch the logged-in user's details (without sensitive fields)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken").lean();

    // Step 6: Set HTTP-only cookies and respond with user details and tokens
    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully."));
});

// Logout User
const logoutUser = asyncHandler(async (req, res) => {
    // Step 1: Clear the refresh token from the user's document
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: "" } }, { new: true });

    // Step 2: Clear access and refresh token cookies
    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, null, "User logged out successfully."));
});

// Change Password
const ChangePasswordUser = asyncHandler(async (req, res) => {

    // Step 1: Destructure input fields and validate required fields
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
        throw new ApiError(400, "All fields are required.");
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(400, "New password and confirmation do not match.");
    }

    // Step 2: Find the user by ID
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    // Step 3: Verify the current (old) password
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Incorrect current password.");
    }

    // Step 4: Update the user's password
    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    // Step 5: Clear the refresh token and save changes
    user.refreshToken = null;
    await user.save({validateBeforeSave: false});

    // Step 6: Respond with success message
    return res.status(200).json({
        success: true,
        message: "Password changed successfully.",
    });
});

// getCurrent User
const getCurrent = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
        200,
        req.user,
        {
            message:"Current User Fetch Successfully"
        }
    )
});

// Update Account Details
const UpdateAccountDetails = asyncHandler(async (req, res) => {
    const {username, email, fullName} = req.body;
    if(!username || !email || !fullName){
        throw new ApiError(400, "All fields are required.");
    }
    const user = User.findByIdAndUpdate(
        req.user?._id, {$set: {username, email, fullName}}, {new: true}
    ).select("-password -refreshToken");
    return res.status(200).json({
        success: true,
        user,
        message: "Account details updated successfully."
    })
});

// Update Avatar
const UpdateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required.");
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(500, "Error uploading avatar.");
    }
    await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: 
            {
                avatar: avatar.url
            }
        }, 
        {
            new: true
        }
    ).select("-password -refreshToken")
    return res.status(200).json({
        success: true,
        avatar,
        message: "Avatar updated successfully."
    })
});

// Update Cover Image
const UpdateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalFile = req.file?.path;
    if(!coverImageLocalFile){
        throw new ApiError(400, "Avatar file is required.");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalFile)
    if(!coverImage.url){
        throw new ApiError(500, "Error uploading cover Image.");
    }
    await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: 
            {
                coverImage: coverImage.url
            }
        }, 
        {
            new: true
        }
    ).select("-password -refreshToken")
    return res.status(200).json({
        success: true,
        avatar,
        message: "coverImage updated successfully."
    })
});

// Reset Password
const ResetPasswordUser = asyncHandler(async (req, res) => {
    res.json({
        message:"Reset Password"
    })
});

export {
    RefreshAccessToken, 
    registerUser, 
    loginUser, 
    logoutUser, 
    ChangePasswordUser, 
    getCurrent,
    UpdateAccountDetails,
    UpdateUserAvatar,
    UpdateUserCoverImage,
    ResetPasswordUser
}; 