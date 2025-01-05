import mongoose, { Schema, model } from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const VideoSchema = new Schema(
    {
        videoFile: {
            type: String,  // cloundnary url
            required: true
        },
        thumbnail: {
            type: String,  // cloundnary url
            required: true
        },
        title: {
            type: String,  
            required: true
        },
        description: {
            type: String,  
            required: true
        },
        time: {
            type: String,  
            required: true
        },
        duration: {
            type: String,  
            required: true
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    { 
        timestamps: true 
    }
);

VideoSchema.plugin(mongooseAggregatePaginate);

export const Video = model('Video',VideoSchema);