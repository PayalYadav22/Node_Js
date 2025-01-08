import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// User Schema definition
const UserSchema = new Schema(
    {
        username: {
            type: String,
            required: [true, 'Username is required !'],
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: [true, 'Email is required !'],
            unique: true,
            lowercase: true,
            trim: true
        },
        fullName: {
            type: String,
            required: [true, 'Full name is required !'],
            trim: true,
            index: true
        },
        avatar: {
            type: String, // cloudinary URL
            required: [true, 'Avatar is required !'],
        },
        coverImage: {
            type: String, // cloudinary URL
        },
        watchHistory: {
            type: Schema.Types.ObjectId,
            ref: 'Video'
        },
        password: {
            type: String,
            required: [true, 'Password is required !']
        },
        refreshToken: {
            type: String
        }
    },
    { 
        timestamps: true 
    }
);

// Password hashing before saving
UserSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Check if password is correct
UserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// Generate access token
UserSchema.methods.generateAccessToken = async function () {
    return await jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
}

// Generate refresh token
UserSchema.methods.generateRefreshToken = async function () {
    return await jwt.sign({
        _id: this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });
}

export const User = mongoose.model('User', UserSchema);