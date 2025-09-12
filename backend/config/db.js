const mongoose = require('mongoose');

const DB_USERNAME = process.env.DB_USERNAME;
const DB_PASSWORD = process.env.DB_PASSWORD;

const mongoDB = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@municipal-kiosk-cluster.uievwba.mongodb.net/municipal_kiosk_db?retryWrites=true&w=majority&appName=municipal-kiosk-cluster`;

mongoose.set('strictQuery', false);

async function dbMain() {
    console.log(">> About to connect to MongoDB...");
    await mongoose.connect(mongoDB);
    console.log(">> Connected to MongoDB.");
}

dbMain().catch(err => console.error(err));

module.exports = dbMain;
