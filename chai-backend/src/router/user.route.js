import express from 'express'
import {
    refreshAccessToken, 
    registerUser,
    loginUser, 
    logoutUser, 
    changePasswordUser, 
    getCurrentUser,
    resetPasswordUser,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
    
} from "../controllers/user.controller.js"
import upload  from '../middleware/multer.middleware.js'
import verifyJWT from '../middleware/auth.middleware.js'

const router = express.Router()

router.route("/register").post(
    upload.fields([
    {
        name: "avatar",
        maxCount: 1,
    },
    {
        name: "coverImage",
        maxCount: 1,
    },
])
, registerUser)
router.route("/login").post(loginUser)
router.route("/reset-password").post(resetPasswordUser)

// secure routes
router.route("/refreshToken").post(refreshAccessToken)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/changePassword").post(verifyJWT, changePasswordUser)
router.route("/currentUser").get(verifyJWT, getCurrentUser)
router.route("/updateAccount").patch(verifyJWT, getCurrentUser)
router.route("/avatar").patch(verifyJWT,upload.single('avatar'), updateUserAvatar)
router.route("/coverImage").patch(verifyJWT, upload.single('coverImage'), updateUserCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/watchHistory").get(verifyJWT, getWatchHistory)

export default router