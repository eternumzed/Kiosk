const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

async function dbMain() {
    const mongoUri = process.env.MONGO_URI || (() => {
        const DB_USERNAME = process.env.DB_USERNAME;
        const DB_PASSWORD = process.env.DB_PASSWORD;
        if (!DB_USERNAME || !DB_PASSWORD) {
            throw new Error('Missing DB_USERNAME or DB_PASSWORD environment variables (or MONGO_URI).');
        }
        return `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@brgy-biluso-cluster.cmczaok.mongodb.net/brgy_biluso_db?appName=brgy-biluso-cluster`;
    })();
 
    console.log('>> About to connect to MongoDB...');
    await mongoose.connect(mongoUri, {});
    console.log('>> Connected to MongoDB.');

    // Fix indexes - drop old non-sparse indexes and recreate with sparse
    try {
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        
        // Get existing indexes
        const indexes = await usersCollection.indexes();
        
        // Check if phoneNumber index exists and is not sparse
        const phoneIndex = indexes.find(idx => idx.key && idx.key.phoneNumber === 1);
        if (phoneIndex && !phoneIndex.sparse) {
            console.log('>> Dropping old phoneNumber index (not sparse)...');
            await usersCollection.dropIndex('phoneNumber_1');
            console.log('>> phoneNumber index dropped. Mongoose will recreate with sparse: true');
        }
    } catch (err) {
        // Index might not exist, that's fine
        if (!err.message.includes('index not found')) {
            console.log('>> Index fix note:', err.message);
        }
    }
}

module.exports = { dbMain };
