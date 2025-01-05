import mongoose, { Schema, model } from mongoose;
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

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
            required: [true, 'fullName is required !'],
            trim: true,
            index: true
        },
        avatar: {
            type: String, // cloudnary url
            required: [true, 'Avatar is required !'],
        },
        coverImage: {
            type: String, // cloudnary
        },
        watchHistory: {
            type: Schema.Types.objectId,
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

UserSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password, 10)
    next();
});

UserSchema.methods.isPasswordCorrect = async function (password) {
   return await bcrypt.compare(password, this.password)   
}

UserSchema.methods.generateAcessToken = async function () {
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

UserSchema.methods.generateRefreshToken = async function () {
    return await jwt.sign({
        _id: this._id,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });    
}

export const User = model('User',UserSchema);