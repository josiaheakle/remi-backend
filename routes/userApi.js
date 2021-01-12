
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
    
    if(message.type === 'VALID') {
        res.status(200).send(message)
    } else {
        res.status(400).send(message.message)
    }
  
})
  
router.post('/new', [
    body('username').isLength({ min: 2, max: 30 }).trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().isLength({ min: 6, max: 20}),
    body('phone_number').exists().isMobilePhone(),
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
        res.status(200).send(message.message)
    } else {
        res.status(400).send(message.message)
    }
  
  })


router.post('/delete', [
    body('userID').notEmpty(),
    body('password').notEmpty()
],
async (req, res, next) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log(`Errors:`)
      console.log(errors.array())
      return res.status(400).json({ errors: errors.array() });
    }

    const delRes = await DBHandler.deleteUser(req.body.userID, req.body.password)
    if(delRes.success===true) {
        res.status(200).send(delRes)
    } else {
        res.status(400).send(delRes)
    }

})

router.post('/update', [
    body('field').isIn(['time_zone', 'phone_number', 'email', 'time_zone', 'password']),
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
                res.status(400).send(ret)
            }
        } else {
            res.status(400).json({
                type: "INVALID",
                message: "Password must be between 6 and 20 characters."
            })
        }
    } else {
        let ret = await DBHandler.updateUserInfo(field, value, user)
        if(ret.type === 'SUCCESS') {
            res.status(200).send(ret)
        } else {
            res.status(400).send(ret)
        }
    }

})

// router.post('/update/phone_number', [

// ], async (req, res, next) => {

//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       console.log(`Errors:`)
//       console.log(errors.array())

//       // if the phone number is not a valid phone number, return invalid 
//       if(errors.array().some((e) => {
//         if(e.param === 'phone_number') {
//             return true
//         }
//       })) {
//         return res.status(200).send({
//             type: "INVALID",
//             message: "Must be a real phone number."
//         })
//       } else if (errors.array().some((e) => {
//           if(e.param === 'user') {
//               return true
//           }
//       })) {
//           return res.status(200).send({
//               type: "INVALID",
//               message: "User information is invalid, please logout and try again."
//           })
//       } else {
//           return res.status(400).json(errors.array())
//       }
//     }

//     let value = req.body.value;
//     let user = req.body.user;

//     // check if phone number is in use already 
//     let validRes = await DBHandler.checkForExistingPhoneNumber(value, user)
//     if(validRes.type === 'VALID') {
//         let result = await DBHandler.updateUserInfo('phone_number', value, user)
//         if(result.type === 'SUCCESS') {
//             res.status(200).send(result)
//         } else {
//             res.status(200).send(result)
//         }
//     } else {
//         res.status(200).send(validRes)
//     }


// })

// router.post('/update/time_zone', [
//     body('field').isIn(['time_zone']),
//     body('value').notEmpty(),
//     body('user').notEmpty()
// ], async (req, res, next) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       console.log(`Errors:`)
//       console.log(errors.array())

//       if(errors.array().some((e) => {
//         if(e.param === 'time_zone') {
//             return true
//         }
//       })) {
//         return res.status(200).send({
//             type: "INVALID",
//             message: "Must be a valid time zone."
//         })
//       } else if (errors.array().some((e) => {
//           if(e.param === 'user') {
//               return true
//           }
//       })) {
//           return res.status(200).send({
//               type: "INVALID",
//               message: "User information is invalid, please logout and try again."
//           })
//       } else {
//           return res.status(400).json(errors.array())
//       }
//     }

//     let value = req.body.value;
//     let user = req.body.user;

//     let result = await DBHandler.updateUserInfo('time_zone', value, user)
//     if(result.type === 'SUCCESS') {
//         res.status(200).send(result)
//     } else {
//         res.status(200).send(result)
//     }
// })

// router.post('/update/email', [
//     body('field').isIn(['email']),
//     body('value').isEmail().normalizeEmail(),
//     body('user').notEmpty()
// ], async (req, res, next) => {

//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       console.log(`Errors:`)
//       console.log(errors.array())

//       if(errors.array().some((e) => {
//         if(e.param === 'email') {
//             return true
//         }
//       })) {
//         return res.status(200).send({
//             type: "INVALID",
//             message: "Must be a valid email."
//         })
//       } else if (errors.array().some((e) => {
//           if(e.param === 'user') {
//               return true
//           }
//       })) {
//           return res.status(200).send({
//               type: "INVALID",
//               message: "User information is invalid, please logout and try again."
//           })
//       } else {
//           return res.status(400).json(errors.array())
//       }
//     }
//     let field = req.body.field;
//     let value = req.body.value;
//     let user = req.body.user;

//     let validRes = await DBHandler.checkForExistingEmail(value, user)
//     if(validRes.type === 'VALID') {
//         let result = await DBHandler.updateUserInfo('email', value, user)
//         if(result.type === 'SUCCESS') {
//             res.status(200).send(result)
//         } else {
//             res.status(200).send(result)
//         }
//     } else {
//         res.status(200).send(validRes)
//     }

// })

// router.post('/update/username', [
//     body('field').isIn(['username']),
//     body('value').isLength({ min: 2, max: 30 }).trim().escape(),
//     body('user').notEmpty()
// ], async (req, res, next) => {

//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       console.log(`Errors:`)
//       console.log(errors.array())

//       if(errors.array().some((e) => {
//         if(e.param === 'phone_number') {
//             return true
//         }
//       })) {
//         return res.status(200).send({
//             type: "INVALID",
//             message: "Name must be between 2 and 30 characters."
//         })
//       } else if (errors.array().some((e) => {
//           if(e.param === 'user') {
//               return true
//           }
//       })) {
//           return res.status(200).send({
//               type: "INVALID",
//               message: "User information is invalid, please logout and try again."
//           })
//       } else {
//           return res.status(400).json(errors.array())
//       }
//     }

//     let field = req.body.field;
//     let value = req.body.value;
//     let user = req.body.user;


//     let result = await DBHandler.updateUserInfo('username', value, user)
//     if(result.type === 'SUCCESS') {
//         res.status(200).send(result)
//     } else {
//         res.status(200).send(result)
//     }

// })



module.exports = router;