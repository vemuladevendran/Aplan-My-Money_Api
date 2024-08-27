'use strict';

const jwt = require('jsonwebtoken');

// Set the expiration period and secret key from environment variables
const tokenExpirePeriod = process.env.TOKEN_EXPIRE_PERIOD || '3d';
const jwtSecret = process.env.JWT_SECRET;

// Method to generate a JWT token
async function generateToken(payload, expiresIn = tokenExpirePeriod) {
    if (!payload || typeof payload !== 'object') {
        throw new TypeError('Token payload must be a non-empty object');
    }

    return new Promise((resolve, reject) => {
        jwt.sign(payload, jwtSecret, { expiresIn }, (error, token) => {
            if (error) {
                reject(new Error(`Error generating token: ${error.message}`));
            } else {
                resolve(token);
            }
        });
    });
}

// Method to verify a JWT token
async function verifyToken(token) {
    if (!token) {
        throw new TypeError('Token must not be empty');
    }

    console.log(token, '-----------');
    

    return new Promise((resolve, reject) => {
        jwt.verify(token, jwtSecret, (error, decodedToken) => {
            if (error) {
                reject(new Error(`Error verifying token: ${error.message}`));
            } else {
                resolve(decodedToken);
            }
        });
    });
}

module.exports = {
    generateToken,
    verifyToken,
};
