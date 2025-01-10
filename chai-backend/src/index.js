import dotenv from 'dotenv'
import connectDB from './db/database.js';
import app from './app.js';

dotenv.config({
    path:'./env'
});

connectDB()
.then(()=>{
    app.on("error",(error) => {
        console.error(`Server Connection Failed ${error.message}`);
        throw error;
    });
    app.listen(process.env.PORT || 5000, () => {
        console.error(`Server is running at port ${process.env.PORT || 5000}`);
    });
})
.catch((error)=>{
    console.error(`MongoDB Connection Failed ${error.message}`);  
    throw error; 
});