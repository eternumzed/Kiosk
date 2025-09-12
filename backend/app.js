const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config({
    path: '../.env'
});
const config = require('./config/db.js');

const PORT = process.env.PORT || '5000';
const corsOptions = {
    origin: 'http://localhost:5173', // Specify the allowed origin
    methods: ['GET', 'POST'], // Specify allowed HTTP methods
    allowedHeaders: ['Content-Type'], // Specify allowed headers
    credentials: true, // Allow credentials (cookies, authentication)
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

config.dbMain;

const userRoutes = require('./routes/userRoute.js');
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
    res.send('Hello world!');

})

app.listen(PORT, () => {
    console.log(`>> Listening at PORT: ${PORT}`)
})


