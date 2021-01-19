const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const UserLoginModel = require('../models/UserModel.js');
const ReminderModel = require('../models/ReminderModel.js');

const DBHandler = (() => {

    // HANDLES ALL DB ACTIVITY
    const dbUrl = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wnmlw.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

    mongoose.set('useNewUrlParser', true);
    mongoose.set('useUnifiedTopology', true);
    mongoose.connect(dbUrl)
    const db = mongoose.connection
    db.on('error', (error) => console.error(`ERROR CONNECTING TO DB ${dbUrl}:`, error))
    db.once('open', () => console.log('connected to database'))

    // USER ======================================================================== USER

    const checkForExistingUsername = async (username, id) => {


        /*
            returns object
                {
                    type: VALID, INVALID
                    message: (Username already in use, Username available, That username is already associated with your account)\
                }
        */

        let user = await UserLoginModel.findOne({username:username})
        if(user) {
            if(`${user._id}` === `${id}`) {
                return {
                    type: "INVALID",
                    message: "That username is already associated with your account."
                }
            } else {
                return {
                    type: "INVALID",
                    message: "Username already in use."
                }
            }
        } else {
            return {
                type: "VALID",
                message: "Username available."
            }
        }

    }

    const checkForExistingEmail = async (email, id) => {

        /*
            returns object
                {
                    type: VALID, INVALID
                    message: (Email already in use, Email available, That email is already associated with your account)
                }
        */

       let user = await UserLoginModel.findOne({email:email})
       if(user) {
        if(`${user._id}` === `${id}`) {
            return {
                   type: "INVALID",
                   message: "That email is already associated with your account."
               }
           } else {
               return {
                   type: "INVALID",
                   message: "Email already in use."
               }
           }
       } else {
           return {
               type: "VALID",
               message: "Email available."
           }
       }

    }

    const checkForExistingPhoneNumber = async (phone_number, id) => {

                /*
            returns object
                {
                    type: VALID, INVALID
                    message: (Phone number already in use, Phone number available, That phone number is already associated with your account)
                }
        */

       let user = await UserLoginModel.findOne({phone_number:phone_number})

       if(user) {
           if(`${user._id}` === `${id}`) {
               return {
                   type: "INVALID",
                   message: "That phone number is already associated with your account."
               }
           } else {
               return {
                   type: "INVALID",
                   message: "Phone number already in use."
               }
           }
       } else {
           return {
               type: "VALID",
               message: "Phone number available."
           }
       }

    }

    const updateUserInfo = async (field, value, id) => {

        /*
            returns {
                type: "SUCCESS", "ERROR",
                message
            }
        */

        let result
        if(field === 'email') {
            result = await UserLoginModel.updateOne({_id: id}, {[field]:value, email_verified: false})
        } else if (field === 'phone_number') {
            result = await UserLoginModel.updateOne({_id: id}, {[field]:value , phone_number_verified: false})
        } else {
            result = await UserLoginModel.updateOne({_id: id}, {[field]:value})
        }

        if( result.modifiedCount !== 0 ) {
            return {
                type: "SUCCESS",
                message: `User's ${field} successfully updated to ${value}.`,
            }
        } else {
            return {
                type: "ERROR",
                message: "Error updating user's information"
            }
        }

    }

    const updateUserPassword = async (newPass, oldPass, userID) => {

        let user = await findUserById(userID)

        if(!user) {
            return {
                type: "INVALID",
                message: "User is invalid"
            }
        } else {

            let isPassValid = await bcrypt.compare(oldPass, user.password)
            
            if(isPassValid) {
                const cryptPass = await bcrypt.hash(newPass, 10);
                user.password = cryptPass
                let res = await user.save();
                if(res === user) {
                    return {
                        type: "SUCCESS",
                        message: "Updated password."
                    }
                } else {
                    return {
                        type: "ERROR",
                        message: "Unable to change password."
                    }
                }
            }
        }

    }
    
    const getUserTimeZone = async (userID) => {
        let user = await  UserLoginModel.findById(userID)
        return user.time_zone
    }

    const _checkForExistingUser = async (username, email, phone_number) => {

        // Checks DB if username or email is in user
            // returns 0 if neither are in user
            // returns 1 if username is in use
            // returns 2 if email is in use
            // returns 3 if phonenumber is in use
            // returns -1 if error

        // let usernameExists = await UserLoginModel.exists({username: username});
        let emailExists = await UserLoginModel.exists({email: email});
        let phoneNumExists = await UserLoginModel.exists({phone_number: phone_number})

        if(!emailExists && !phoneNumExists) {
            return 0;
        } else if (emailExists) {
            return 2;
        } else if (phoneNumExists) {
            return 3;
        } else return -1;

    }

    const _userSwitchCode = async (code, newUser, fixedNumber) => {
        switch (code) {
            case (0): 
                const cryptPass = await bcrypt.hash(newUser.password, 10);
                const user = await new UserLoginModel({
                    username: newUser.username,
                    email: newUser.email,
                    phone_number: fixedNumber,
                    password: cryptPass,
                    time_zone: newUser.time_zone,
                    phone_number_verified: false,
                    email_verified: false
                }).save();
                if(user) {
                    _currentUser = user;
                    return {
                        type: 'VALID',
                        message: 'User successfully created',
                        user: user
                    }
                } else {
                    return {
                        type: 'ERROR',
                        message: 'Error saving user to database'
                    }
                }
            case (1): 
                return {
                    type: 'INVALID',
                    message: 'Username already in use'
                }
            case (2): 
                return {
                    type: 'INVALID',
                    message: 'Email already in use'
                }
            case(3):
                return {
                    type: 'INVALID',
                    message: 'Phone number already in use'
                }
            case (-1):
            case (-2):
                return {
                    type: 'ERROR',
                    message: 'Error creating user'
                }
        }
            
    }

    const createUser = async (newUser) => {
        // Creates a new user if username or email is not used
        // newUser - {username, email, password}
        // returns obj - { type, message } 
        //      types - ERROR, INVALID, VALID

        try {

            let fixedPhoneNum = '';
            if(newUser.phone_number.length !== 11 || newUser.phone_number[0] != '1' || newUser.phone_number.includes(' ')) {
                let strs = newUser.phone_number.split(' ');
                strs.forEach(s => {
                    fixedPhoneNum = `${fixedPhoneNum}${s}`
                })
                fixedPhoneNum = `1${fixedPhoneNum}`
            } else {
                fixedPhoneNum = newUser.phone_number
            }

            const code = await _checkForExistingUser(newUser.username, newUser.email, fixedPhoneNum)
            const message = await _userSwitchCode(code, newUser, fixedPhoneNum)
            return message;
        } catch (err) {
            console.error(err)
            return {
                type: 'ERROR',
                message: 'Trouble creating a new user, please try again.'
            }
        }

    }

    const loginUser = async (existingUser) => {
        // Searches DB for existing user
        // existingUser - {email, password}
        // returns object - { type, message }, or user if VALID
        //      object types - ERROR, INVALID, VALID

        const user = await UserLoginModel.findOne({email: existingUser.email});
        if (!user) {
            return {
                type: 'INVALID',
                message: 'Invalid email'
            }
        } else if (!(await bcrypt.compare(existingUser.password, user.password))) {
            return {
                type: 'INVALID',
                message: 'Invalid password'
            }
        } else if ((await bcrypt.compare(existingUser.password, user.password))) {
            _currentUser = user;
            return {
                type: 'SUCCESS',
                message: 'User successfully logged in.',
                user: user,
            }
        } else {
            return {
                type: 'ERROR',
                message: 'Error logging in user'
            }
        }
    }

    const deleteUser = async (id, password) => {

        /*
        return type:
            if invalid - "INVALID"
            if valid && success - "SUCCESS"
            if error - "ERROR"
        */
        
        const user = await findUserById(id)
        const isPassValid = await bcrypt.compare(password, user.password)
        if(!isPassValid) {
            return {
                type: 'INVALID',
                message: 'Invalid password.',
                success: false
            }
        } else {
            const res = await UserLoginModel.findByIdAndDelete(id);
            if(res) {
                console.log('DB response, deleting user')
                console.log(res)
                _deleteAllUserReminders(id)
                return {
                    type: "SUCCESS",
                    message: "Successfully deleted user.",
                    success: true
                }
            } else {
                return {
                    type: "ERROR",
                    message: "Error deleting from databse.",
                    success: false
                }
            }
        }

    }

    const _deleteAllUserReminders = async (userId) => {

        const res = await ReminderModel.deleteMany({user: userId})
        return !!res

    }

    
    const findUserById = async (id) => {
        const user = await UserLoginModel.findById(id);
        return user;
    }
    
    // USER VERIFICATION
    
    const setUserVerified = async (verificationType, userId) => {

        // verificationType = 'phone_number' || 'email'


        switch(verificationType) {
            case('phone_number'):
                try {
                    const res = await UserLoginModel.updateOne(
                        {_id: userId},
                        {phone_number_verified: true}
                    )
                    return {
                        type: "SUCCESS",
                        message: "Verified phone number"
                    }
                } catch (err ) {
                    console.log(err)
                    return {
                        type: "ERROR",
                        message: "Error verifying phone number"
                    }
                }
                break;
            case('email'):
                try {
                    const res = await UserLoginModel.updateOne(
                        {_id: userId},
                        {email_verified: true}
                    )
                    return {
                        type: "SUCCESS",
                        message: "Verified email"
                    }
                } catch (err ) {
                    console.log(err)
                    return {
                        type: "ERROR",
                        message: "Error verifying email"
                    }
                }
                break;
        }

    }

    const getUserVerificationInfo = async (id) => {
        const user = await UserLoginModel.findById(id);
        return {
            'email_verified': user.email_verified,
            'phone_number_verified': user.phone_number_verified
        }
    }

    // REMINDER ====================================================== REMINDER


    const createNewReminder = async ( reminderObj ) => {
        // CREATES NEW REMINDER OBJECT
        // newReminder - {title, startdate, frequency, textstring, link

        const reminder = await new ReminderModel({
            'title': reminderObj.title,
            'start_date': reminderObj.start_date,
            'next_date': reminderObj.next_date || reminderObj.start_date,
            'freq': reminderObj.freq,
            'text': reminderObj.text,
            'time_zone': reminderObj.time_zone,
            'user': reminderObj.user,
            'type': reminderObj.type
        }).save()
        if(reminder) { 
            return {
                type: "SUCCESS",
                message: "Reminder saved to database.",
                reminder: reminder
            }
        } else {
            return {
                types: "ERROR",
                message: "Error saving reminder to database."
            }
        }
    
    }

    const updateReminder = async ( reminderId, reminderObj ) => {

        // let reminder = await reminderObj

        
        let reminder = reminderObj
        console.log(`REMINDER TO UPDATE`, reminder)

        try {

            const res = await ReminderModel.findByIdAndUpdate(reminderId, {
                'title': reminder.title,
                'start_date': reminder.start_date,
                'next_date': reminder.start_date,
                'freq': reminder.freq,
                'text': reminder.text,
                'time_zone': reminder.time_zone,
                'type': reminder.type
            })

            console.log(`update reminder res`)
            console.log(res)
            
            if(!!res) {

                console.log(`here at !! res`)

                return {
                    type: "SUCCESS",
                    message: "Updated reminder"
                }
            } else {
                throw "Unable to update reminder"
            }

        } catch (err) {

            console.log(err)

            return {
                type: "ERROR",
                message: err
            }
        }

    }

    const updateReminderNextDate = async (reminderId, reminderObj) => {
        let reminder = reminderObj

        try {
            const res = await ReminderModel.findByIdAndUpdate(reminderId, {'next_date': reminder.next_date})

            // const res = await ReminderModel.updateOne(
            //     {_id: reminderId},
            //     {'next_date': reminder.next_date}
            // )
            
            if(!!res) {
                return {
                    type: "SUCCESS",
                    message: "Updated next date"
                }
            } else throw 'Unable to update next date'

        } catch (err) {
            console.error(`Error updating reminder`)
            console.error(err)
            return {
                type: "ERROR",
                message: err
            }

        }
    }
    
    const deleteReminder = async (reminderId) => {

        console.log(`trying to delete reminder`)

        try {
            const res = await ReminderModel.deleteOne({_id: reminderId})
            console.log(`Deleting reminder`)
            console.log(res)
            return 'Reminder deleted'
        } catch (err) {
            console.error(`ERROR deleting reminder,`)
            console.error(err)
            return 'Error deleting reminder'
        }
    }
    
    const getAllReminders = async () => {
        try {
            const reminders = await ReminderModel.find({})
            // console.log(`ALL REMINDERS`)
            // console.log(reminders)
            return reminders
        } catch (err) {
            console.log(`Error getting all reminders`, err)
        }
    }

    const getRemindersByUser = async (userId) => {

        try {
            const reminders = await ReminderModel.find({user: userId})
            return {
                type: "SUCCESS",
                message: 'Got all user reminders',
                reminders: reminders
            }
        } catch (er) {
            return {
                type: "ERROR",
                message: er
            }
        }

    }

    const getReminderById = async (remId) => {

        // let id = await remId

        const reminder = await ReminderModel.findById(remId)

        // const reminder = await ReminderModel.findOne({_id: id})

        return reminder

    }

    return {
        // USER
        createUser: createUser,
        loginUser: loginUser,
        findUserById: findUserById,
        deleteUser: deleteUser,
        checkForExistingUsername: checkForExistingUsername,
        checkForExistingPhoneNumber: checkForExistingPhoneNumber,
        checkForExistingEmail: checkForExistingEmail,
        getUserTimeZone: getUserTimeZone,
        updateUserInfo: updateUserInfo,
        updateUserPassword: updateUserPassword,
        // USER VERIFICATION
        setUserVerified: setUserVerified,
        getUserVerificationInfo: getUserVerificationInfo,
        // REMINDER
        createNewReminder: createNewReminder,
        updateReminder: updateReminder,
        updateReminderNextDate: updateReminderNextDate,
        deleteReminder: deleteReminder,
        getAllReminders: getAllReminders,
        getRemindersByUser: getRemindersByUser,
        getReminderById: getReminderById
    }

})();

module.exports = DBHandler;