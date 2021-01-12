let nodemailer = require('nodemailer')
let EmailVerificationModel = require('../models/VerificationModel.js');
const DBHandler = require('./DBHandler.js');

const EmailHandler = (() => {

    const thisEmailAddress = process.env.EMAIL_FROM;

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: thisEmailAddress,
          pass: process.env.EMAIL_PASS
        }
    });

    const _generateCode = () => {
        var val = Math.floor(1000 + Math.random() * 9000);
        return val
    }

    const checkVerificationCode = async (code, userId) => {
        let userCode = await EmailVerificationModel.findOne({user: userId})
        if(!userCode) {
            return {
                type: 'ERROR',
                message: "No code found for that user."
            }
        } else {
            if(`${userCode.code}` === `${code}`) {
                let res = await DBHandler.setUserVerified('email', userId)
                if(res.type === 'SUCCESS') {
                    return {
                        type: "SUCCESS",
                        message: "Verified user's email."
                    }
                } else {
                    return {
                        type: "ERROR",
                        message: "Error updating user verification status"
                    }
                }
            } else {
                return {
                    type: "INVALID",
                    message: "Code is not valid, please try again."
                }
            }
        }
    }
 
    const sendVerificationCode = async (userId) => {

        let user = await DBHandler.findUserById(userId)

        let code = _generateCode()
        let savedCode = new EmailVerificationModel({
            code: code,
            user: userId
        }).save()

        var options = {
            from: thisEmailAddress,
            to: user.email,
            subject: 'Verify Remi email.',
            text: `In order to verify your email address, use this code [${code}].`
        };
        
        transporter.sendMail(options, function(error, info){
        if (error) {
            console.log(error);
            return {
                type: "ERROR",
                message: "Unable to send verification email at this time, please try again later.",
                error: error
            }
        } else {
            console.log('Email sent: ' + info.response);
            return {
                type: "SUCCESS",
                message: info.response
            }
        }
        });

    }

    const sendReminder = (user, reminder) => {
        var options = {
            from: thisEmailAddress,
            to: user.email,
            subject: reminder.title,
            text: `${reminder.text}\- Remi`
        };
        
        if(user.email_verified) {

            transporter.sendMail(options, function(error, info){
            if (error) {
                console.log(error);
                return {
                    type: "ERROR",
                    message: "Unable to send verification email at this time, please try again later.",
                    error: error
                }
            } else {
                console.log('Email sent: ' + info.response);
                return {
                    type: "SUCCESS",
                    message: info.response
                }
            }
            });
        } else {
            return {
                type: "INVALID",
                message: "Email must be verified in order to send reminders."
            }
        }
    }

    return {
        sendVerificationCode: sendVerificationCode,
        checkVerificationCode: checkVerificationCode,
        sendReminder: sendReminder
    }

})();

module.exports = EmailHandler;