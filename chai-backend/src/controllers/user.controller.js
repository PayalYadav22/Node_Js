import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from '../utils/Cloudinary.js';

// generateAccess and refreshToken

const generateAccessAndRefreshToken = async (userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})
        return { accessToken, refreshToken }
    }
    catch(error){
        throw new ApiError(500,'Something went wrong while generating refresh and access token')
    }
}

// Register User

const registerUser = asyncHandler(async (req, res) => {
    
    const { username, email, fullName, password } = req.body;

    if ([username, fullName, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required.");
    }

    const exitedUser = await User.findOne({ $or: [{ username }, { email }] })
    if (exitedUser) {
        throw new ApiError(409, "User with email or username already exists.");
    }

    const avatarLocalFile = req.files?.avatar[0]?.path; 
    const coverImageLocalFile = req.files?.coverImage[0]?.path; 

    if (!avatarLocalFile) {
        throw new ApiError(400, "Avatar file is required.");
    }

    const avatar = await uploadOnCloudinary(avatarLocalFile);
    const coverImage = await uploadOnCloudinary(coverImageLocalFile);

    if (!avatar) {
        throw new ApiError(400, "Failed to upload avatar.");
    }

    const user = await User.create({
        username: username.toLowerCase(),
        fullName: fullName,
        email,
        avatar: avatar,
        coverImage:  coverImage || null,
        password
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user.")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully.")
    );
});

// Login User

const loginUser = asyncHandler(async (req, res) => {

    // req body -> data
    const {email, username, password} = req.body

    // username or email
    if((!username || !email) || !password){
        throw ApiError(400, "Username or Email and Password is Required");
    }

    // find the user
    const user = await User.findOne({$or : [{username}, {email}]})

    // check user
    if(!user){
        throw ApiError(404, "User not Found")
    }

    // Check password
    const isPasswordCorrect = await user.isPasswordCorrect(password)

    // valid password
    if(!isPasswordCorrect){
        throw ApiError(401, "Invalid User Credentials")
    }

    // accessToken and refreshToken
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = User.findById(user._id).select(-password, -refreshToken)

    const options = {
        httpOnly: true,
        secure: true
    }

    // set cookies
    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        200,
        {
            user: loggedInUser, accessToken, refreshToken
        },
        "User Logged in Sucessfully"
    )
});

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {
            "message": "User Logged Out"
        })
    )
}); 


export {registerUser, loginUser, logoutUser};