const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userLoginSchema = new Schema({
    'email': {
        type: String,
        required: true
    },
    'username': {
        type: String,
        required: true
    },
    'password': {
        type: String,
        required: true
    },
    'phone_number': {
        type: Number,
        required: true
    },
    'phone_number_verified': {
        type: Boolean
    },
    'email_verified': {
        type: Boolean
    },
    'time_zone': {
        type: String,
        required: true
    }
})

const UserLoginModel = mongoose.model ('UserLogin', userLoginSchema);

module.exports = UserLoginModel;