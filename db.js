const mongoose = require('mongoose');

const connection = mongoose.connect('mongodb://127.0.0.1:27017/mymoney')


connection
    .then(() => {
        console.log("Database connected");
    })
    .catch((error) => {
        console.log(`Fail to connect Database ${error}`);
        
    })

module.exports = {
    db: connection
}