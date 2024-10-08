// env configuration
const dotenv = require('dotenv');
dotenv.config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

require('./db');
const userRoutes = require("./routes/user");
const groupRoutes = require("./routes/group");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(morgan("tiny"));
app.use(express.json());

// Allow all origins with CORS
app.use(cors());

app.use("/static", express.static("uploads"));

// routes
userRoutes(app);
groupRoutes(app);


// error middleware 
app.use((error, req, res, next) => {
    res.status(500).json({
        message: error.message,
        error: 'Something went wrong please try later'
    });
});

// server listening on the port 3000
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is listening on the port ${PORT}`);
});
