const mongoose = require('mongoose');

mongoose.set('strictQuery', false);

async function dbMain() {
    const mongoUri = process.env.MONGO_URI || (() => {
        const DB_USERNAME = process.env.DB_USERNAME;
        const DB_PASSWORD = process.env.DB_PASSWORD;
        if (!DB_USERNAME || !DB_PASSWORD) {
            throw new Error('Missing DB_USERNAME or DB_PASSWORD environment variables (or MONGO_URI).');
        }
        return `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@municipal-kiosk-cluster.uievwba.mongodb.net/municipal_kiosk_db?appName=municipal-kiosk-cluster`;
    })();

    console.log('>> About to connect to MongoDB...');
    await mongoose.connect(mongoUri, {});
    console.log('>> Connected to MongoDB.');
}

module.exports = { dbMain };
