import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async () => {
    try{
        const connect = await mongoose.connect(`${process.env.MONGO_URI}${DB_NAME}`);
    }catch(error){
        console.error(`MongoDB Connection Failed ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;