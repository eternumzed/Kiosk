const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config({
    path: '../.env'
});
const config = require('./config/db.js');

const PORT = '5000';
const corsOptions = {
    origin: 'http://localhost:4000', // Specify the allowed origin
    methods: ['GET', 'POST'], // Specify allowed HTTP methods
    allowedHeaders: ['Content-Type'], // Specify allowed headers
    credentials: true, // Allow credentials (cookies, authentication)
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

config.dbMain;
const paymentRoutes = require('./routes/paymentRoute.js');
const requestRoutes = require('./routes/requestRoute.js');

app.use('/api/payment', paymentRoutes);
app.use('/api/request', requestRoutes);

app.get('/', (req, res) => {
    res.send('Hello world!');

})

app.listen(PORT, () => {
    console.log(`>> Listening at PORT: ${PORT}`)
})


