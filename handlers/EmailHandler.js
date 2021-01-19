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

        let code;
        let oldCode = await EmailVerificationModel.findOne({user: userId})

        console.log(`old code : `)
        console.log(oldCode)


        if(!oldCode) {
            code = _generateCode()
            let savedCode = new EmailVerificationModel({
                code: code,
                user: userId
            }).save()
        } else {
            code = oldCode.code
        }

        var options = {
            from: thisEmailAddress,
            to: user.email,
            subject: 'Verify Remi email.',
            text: `In order to verify your email address, use this code [${code}].`
        };
        

        return new Promise( (res, rej) => {
            transporter.sendMail(options, (error, info) => {
            if (error) {
                console.log(error);
                rej({
                    type: "ERROR",
                    message: "Unable to send verification email at this time, please try again later.",
                    error: error
                })
            } else {
                console.log('Email sent: ' + info.response);
                res({
                    type: "SUCCESS",
                    message: info.response
                })
            }
            });
        })

    }

    const sendReminder = async (reminder) => {

        console.log(`trying to email reminder`)
        console.log(reminder)

        let user = await DBHandler.findUserById(reminder.user)

        var options = {
            from: thisEmailAddress,
            to: user.email,
            subject: reminder.title,
            text: `${reminder.text}\n- Remi`
        };
        

        console.log(`user`)
        console.log(user)

        if(!!user.email_verified) {

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
            console.log(`user email not verified`)
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