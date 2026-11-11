
import { MongoClient } from 'mongodb';
import { setServers } from 'node:dns';

let client;
let db;

// Configure Google DNS before MongoDB performs SRV lookup
setServers(['8.8.8.8', '8.8.4.4']);

export const connectDB = async () => {
    try {
        const connectionString = process.env.MONGODB_URI;

        if (!connectionString) {
            throw new Error('MONGODB_URI is missing in .env file');
        }

        client = new MongoClient(connectionString, {
            serverSelectionTimeoutMS: 15000,
            connectTimeoutMS: 15000
        });

        await client.connect();

        db = client.db('studypilot_ai');

        await db.command({ ping: 1 });

        console.log('MongoDB Atlas connected successfully!');

        return db;

    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        throw error;
    }
};

export const getDB = () => {
    if (!db) {
        throw new Error('Database is not connected');
    }

    return db;
};

export const closeDB = async () => {
    if (client) {
        await client.close();
        console.log('MongoDB connection closed');
    }
};
