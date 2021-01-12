const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const emailVerificationSchema = new Schema({
    'code': {
        type: String,
        required: true
    },
    'user': {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    }
})

const EmailVerificationModel = mongoose.model ('EmailVerification', emailVerificationSchema);

module.exports = EmailVerificationModel;