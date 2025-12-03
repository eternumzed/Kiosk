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
app.use(express.json({ type: '*/*' }));
app.use(bodyParser.urlencoded({ extended: false }));

config.dbMain;
const paymentRoutes = require('./routes/paymentRoute.js');
const requestRoutes = require('./routes/requestRoute.js');
const printRoutes = require('./routes/printRoute.js');

// app.use((req, res, next) => {
//     console.log(`Incoming ${req.method} ${req.originalUrl}`);
//     next();
// });

app.use('/api/payment', paymentRoutes);
app.use('/api/request', requestRoutes);
app.use('/api/print', printRoutes);


app.get('/', (req, res) => {
    res.send('Hello world!');

})

app.listen(PORT, () => {
    console.log(`>> Listening at PORT: ${PORT}`)
})


