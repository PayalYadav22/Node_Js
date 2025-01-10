import { User } from "../models/user.models";
import ApiError from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler"
import jwt from "jsonwebtoken"

const verifyJWT = asyncHandler( async (req, res, next) => {
    try{
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if(!token){
            throw new ApiError(401, "Unauthorized Request")
        }
        const decoadToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decoadToken?._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(401, "Invalid Acess Token")
        }
        req.user = user;
        next();
    }catch(error){
        throw ApiError(401, error?.message || "Invalid access Token")
    }
});

export default verifyJWT