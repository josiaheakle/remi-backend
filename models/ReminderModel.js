const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const reminderSchema = new Schema({
    'title': {
        type: String,
        required: true
    },
    "text": {
        type: String,
        required: true
    },
    'start_date': {
        type: String,
        required: true,
    },
    'next_date': {
        type: String,
        required: true,
    },
    'freq': {
        type: String,
        enum: ["Once", "Daily", "Weekly", "Bi-Weekly", "Monthly", "Yearly"],
        required: true
    }, 
    'time_zone': {
        type: String,
        required: true
    },
    'user': {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserLogin',
        required: true
    },
})

const ReminderModel = mongoose.model ('Reminder', reminderSchema);

module.exports = ReminderModel;