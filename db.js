const mongoose = require('mongoose');

const connection = mongoose.connect(process.env.DB_URL)


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