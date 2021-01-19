
// express
var express = require('express');
const { body, validationResult } = require('express-validator');

// my modules
let DBHandler = require('../handlers/DBHandler.js')

var router = express.Router();

/* 
    /user
      /login [post]
        body {
            email
            password
        }
      /new [post]
        body {
            username
            email
            phone_number
            password
            time_zone
        }
      /delete [post]
        body {
            userID
            password
        }
      /update [post]
        body {
            field
                username ||
                phone_number ||
                time_zone ||
                email ||
                password
            value
            user
            password (ONLY if field === password)
        }
*/

router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res, next) => {
  
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`Errors:`)
      console.log(errors.array())
      return res.status(400).json({ errors: errors.array() });
    }
    
    const userObj = {
        'email': req.body.email,
        'password': req.body.password
    }
    const message = await DBHandler.loginUser(userObj)
    
    if(message.type === 'SUCCESS') {
        res.status(200).send(message)
    } else {
        res.status(202).send(message)
    }
  
})
  
router.post('/new', [
    body('username').isLength({ min: 2, max: 30 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().isLength({ min: 6, max: 20}),
    body('phone_number').exists().trim().isMobilePhone(),
    body('time_zone').notEmpty()
  ], async (req, res, next) => {
  
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`Errors:`)
      console.log(errors.array())
      return res.status(400).json({ errors: errors.array() });
    }
  
    // create user data object
    const userObj = {
        username: req.body.username,
        email: req.body.email,
        phone_number: req.body.phone_number,
        password: req.body.password,
        time_zone: req.body.time_zone
    }
    const message = await DBHandler.createUser(userObj)

    if(message.type === 'VALID') {
        res.status(200).send(message)
    } else {
        res.status(202).send(message)
    }
  
  })


router.post('/delete', [
    body('user').notEmpty(),
    body('password').notEmpty()
],
async (req, res, next) => {

    console.log(`Delete request ${req.body.user} // ${req.body.password}`)

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`Errors:`)
      console.log(errors.array())
      return res.status(400).json({ errors: errors.array() });
    }

    const delRes = await DBHandler.deleteUser(req.body.user, req.body.password)
    if(delRes.success===true) {
        res.status(200).send(delRes)
    } else {
        res.status(202).send(delRes)
    }

})

router.post('/update', [
    body('field').isIn(['time_zone', 'phone_number', 'email', 'time_zone', 'password', 'username']),
    body('value').notEmpty(),
    body('user').notEmpty()
], async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`Errors:`)
      console.log(errors.array())
      return res.status(400).json(errors.array())
    }

    let field = req.body.field
    let value = req.body.value
    let user = req.body.user
    
    if(field === 'password') {
        let password = req.body.value
        let oldPass = req.body.password

        if(password.length >= 6 && password.length <= 20) {
            let ret = await DBHandler.updateUserPassword(password, oldPass, user)
            if(ret.type === 'SUCCESS') {
                res.status(200).send(ret)
            } else {
                res.status(202).send(ret)
            }
        } else {
            res.status(202).json({
                type: "INVALID",
                message: "Password must be between 6 and 20 characters."
            })
        }
    } else {
        let ret = await DBHandler.updateUserInfo(field, value, user)
        if(ret.type === 'SUCCESS') {
            res.status(200).send(ret)
        } else {
            res.status(202).send(ret)
        }
    }

})

module.exports = router;