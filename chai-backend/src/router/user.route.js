import express from 'express';

import { registerUser } from "../controllers/user.controller.js";
import upload  from '../middleware/multer.middleware.js';

const router = express.Router();

router.route("/register").post( upload, registerUser )

export default router;
