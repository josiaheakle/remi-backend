const Vonage = require('@vonage/server-sdk');
const UserLoginModel = require('../models/UserModel');
require('dotenv').config();


const VonageHandler = (() => {

    const fromNum = process.env.FROM_NUM_TEST;

    const vonage = new Vonage({
        apiKey: process.env.VONAGE_API_KEY,
        apiSecret: process.env.VONAGE_API_SECRET
    });

    const checkVerificationCode = async (code, verificationId, callback) => {

        vonage.verify.check({
            request_id: verificationId,
            code: code
        }, (err, result) => {

            console.log(`(VHANDLER checkVerificationCode) result: `)
            console.log(err?err:result)

            if (err) {
                callback({
                    type: "ERROR",
                    message: "Error checking verification code",
                    error: err
                })
            } else {
                callback({
                    type: "SUCCESS",
                    message: result.error_text || "Verification code checked",
                    statusCode: result.status
                })
            }
        });

    }

    const sendVerificationCode = async (number, callback) => {

        // callback called when request is finished 
        //      params - return object {type, message, error/id}

        console.log(`trying this number ${number}`)

        await vonage.verify.request({
            number: number,
            brand: 'Vonage',
            code_length: '4'
        }, (err, result) => {
            console.log(`(VONAGE HANDLER sendVerificationCode)`)

            if(err) {
                console.log(`ERROR TEXT VERIFICATION`)
            } else {
                console.log(`RESULT TEXT VERIFICATION`)
            }

            console.log(err ? err : result)

        

            if (err || result.status !== '0') {
                callback({
                    type: "ERROR",
                    message: "Error sending verification code",
                    error: err || result.error_text
                })
            } else {

                callback({
                    type: "SUCCESS",
                    message: "Sent verification code",
                    id: result.request_id
                })
            }

        });


    }

    const sendReminder = async (rem) => {

        let reminder = await rem

        console.log(`reminder:`)
        console.log(reminder)
        console.log(`user: `, reminder.user)

        const user = await UserLoginModel.findById(reminder.user);
        const phoneNum = user.phone_number
        const message = `Hello, this is Remi! \n${reminder.title} : ${reminder.text}`;

        console.log(phoneNum)

        sendMessage(phoneNum, message, (res) => {
            console.log(res)
        })

    }

    const sendMessage = (phoneNum, message, callback) => {
        vonage.message.sendSms(fromNum, phoneNum, message, (err, res) => {
            if (err) {
                callback(err)
                // console.log(err);
            } else {
                if (res.messages[0]['status'] === "0") {
                    callback("Message sent successfully.")
                    // console.log("Message sent successfully.");
                } else {
                    callback(`Message failed with error: ${responseData.messages[0]['error-text']}`)
                    // console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
                }
            }
        });
    }

    return {
        sendMessage: sendMessage,
        sendReminder: sendReminder,
        sendVerificationCode: sendVerificationCode,
        checkVerificationCode: checkVerificationCode
    }

})();

module.exports = VonageHandler;