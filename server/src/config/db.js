/**
 * config/db.js — MongoDB Connection
 *
 * Uses Mongoose to connect to MongoDB.
 * Connection string is read from MONGO_URI in .env.
 * Returns a promise so server.js can await connection before listening.
 */

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      throw new Error("MONGO_URI is missing in server/.env");
    }

    if (!mongoUri.startsWith("mongodb://") && !mongoUri.startsWith("mongodb+srv://")) {
      throw new Error('MONGO_URI must start with "mongodb://" or "mongodb+srv://"');
    }

    const conn = await mongoose.connect(mongoUri, {
      // Mongoose 8+ does not need these options but kept for clarity
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📂 Database: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
    });

    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    throw error; // Let server.js handle the exit
  }
};

module.exports = connectDB;
