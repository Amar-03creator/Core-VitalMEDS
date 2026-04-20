const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // We tell Mongoose to connect using the secret URI from our .env file
        const conn = await mongoose.connect(process.env.MONGO_URI);   //  URI stands for Uniform Resource Identifier
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Stop the server if the database connection fails
    }
};

module.exports = connectDB;