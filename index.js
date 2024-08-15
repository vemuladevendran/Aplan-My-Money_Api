// env configuration
const dotenv = require('dotenv');
dotenv.config();

const express = require("express")
const cors = require("cors")
const morgan = require("morgan")

require('./db')


const app = express();
app.use(express.urlencoded({extended: true}));
app.use(morgan("tiny"));
app.use(express.json());
app.use(cors());
app.use("/static", express.static("uploads"));




// error middleware 
app.use((error, req, res, next) => {
    res.status(500).json({
        message: error.message,
        error: 'Something went wrong please try later'
    })
})

// server listening on the port 3000
const PORT = 3000 
app.listen(PORT, ()=> {
    console.log(`Server is listering on the port ${PORT}`);
})