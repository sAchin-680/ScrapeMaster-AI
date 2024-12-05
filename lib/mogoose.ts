import mongoose from 'mongoose';
let isConnected: boolean = false;

export const connectDB = async () => {
    mongoose.set('strictQuery', true)

    if(!process.env.MONGODB_URI) return console.log('MONGODB_URI is not defined');
    
    if(isConnected) {
        console.log('=> using existing database connection');
        return;
    }
    try {
        await mongoose.connect(process.env.MONGODB_URI)
        isConnected = true;
        console.log('MongoDB connected');
        
    } catch (error) {
        console.error();
        
    }
    
}