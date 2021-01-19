var express = require('express');
var router = express.Router();
let VonageHandler = require('../handlers/VonageHandler.js')
const EmailHandler = require('../handlers/EmailHandler.js')
const { check, validationResult } = require('express-validator');
const DBHandler = require('../handlers/DBHandler.js');
const EmailVerificationModel = require('../models/VerificationModel.js');

/*
    /verify
      /number/:phone_number [get]
      /info/:userId  [get]
      /code [post]
*/


router.get('/email/:userID', async (req, res, next) => {
    const userID = req.params.userID

    

    let response = await EmailHandler.sendVerificationCode(userID)
    if(response.type === 'SUCCESS') {
        res.status(200).send(response)
    } else {
        res.status(400).send(response)
    }



})

router.get('/number/:phone_number', async (req, res, next) => {

    const phoneNum = req.params.phone_number

    console.log(`(VERIFYAPI ) phoneNum: `, phoneNum)

    await VonageHandler.sendVerificationCode(phoneNum, (result) => {

        console.log(result)

        if(result.type === 'SUCCESS') {
            res.status(200).send(result.id)
            console.log(`verificationid: `, result.id)

        } else {
            res.status(400).send(result.message)
            console.log(result)
        }
    })


})

router.get('/info/:userId', async (req, res, next) => {
    
    const userId = req.params.userId
    const info = await DBHandler.getUserVerificationInfo(userId)

    if(info) {
        res.status(200).send(info)
    } else {
        res.status(400).send('Error getting user validation info')
    }

})

router.post('/code', [
    check('userId').notEmpty(),
    check('id').notEmpty(),
    check('code').isLength({min: 4, max: 4}),
    check('verificationType').isIn(['text', 'email'])
], async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`Errors:`)
      console.log(errors.array())
      return res.status(400).json({ errors: errors.array() });
    }

    const id = req.body.id
    const code = req.body.code
    const userId = req.body.userId
    const verificationType = req.body.verificationType

    if(verificationType === 'text') {
        await VonageHandler.checkVerificationCode(code, id, async (result) => {
            if(result.type === 'SUCCESS') {
                if(result.statusCode === '0') {
                    await DBHandler.setUserVerified('phone_number', userId)
                    res.status(200).send({
                        type: "SUCCESS",
                        message: 'Phone Number successfully verified'
                    })
                } else {
                    res.status(200).send({
                        type: "INVALID",
                        message: 'Invalid verification code'
                    })
                }
            } else {
                res.status(202).send({
                    type: "ERROR",
                    message: "Unable to verify phone number."
                })
                console.log(result)
            }
        })
    } else {
        let response = await EmailHandler.checkVerificationCode(code, userId)
        if(response.type === 'SUCCESS') {
            DBHandler.setUserVerified('email', userId)
            res.status(200).send({
                type: "SUCCESS",
                message: 'Email successfully verified.'
            })
        } else {
            res.status(202).send({
                type: "ERROR",
                message: 'Email failed to verify.'
            })
        }
    }

})

module.exports = router;
