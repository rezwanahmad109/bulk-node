const mongoose = require('mongoose');
const dns = require('dns');

// Fix: Node.js uses the system DNS resolver which may not support SRV records
// used by mongodb+srv://. Switch to Google's public DNS to fix this.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error('Check your MONGODB_URI in the .env file and ensure your IP is whitelisted in MongoDB Atlas.');
        process.exit(1);
    }
};

module.exports = connectDB;
