import express from 'express'
import {registerUser,loginUser, logoutUser} from "../controllers/user.controller.js"
import upload  from '../middleware/multer.middleware.js'
import verifyJWT from '../middleware/auth.middleware.js'

const router = express.Router()

router.route("/register").post(upload, registerUser)
router.route("/login").post(loginUser)

// secure routes
router.route("/logout").post(verifyJWT, logoutUser)


export default router