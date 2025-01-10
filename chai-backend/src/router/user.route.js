import express from 'express'
import {RefreshAccessToken, registerUser,loginUser, logoutUser, ChangePasswordUser, ResetPasswordUser} from "../controllers/user.controller.js"
import upload  from '../middleware/multer.middleware.js'
import verifyJWT from '../middleware/auth.middleware.js'

const router = express.Router()

router.route("/register").post(upload, registerUser)
router.route("/login").post(loginUser)
router.route("/resetPassword").post(ResetPasswordUser)

// secure routes
router.route("/refresh-token").post(RefreshAccessToken)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/changePassword").post(verifyJWT, ChangePasswordUser)

export default router