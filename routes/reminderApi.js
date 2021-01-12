// express
var express = require('express');
const { body, validationResult } = require('express-validator')

// my modules
let DBHandler = require('../handlers/DBHandler.js')
let Scheduler = require('../handlers/Scheduler.js')

var router = express.Router();


/*
    REMINDER OBJ 

    title, 
    text, 
    start_date,
    next_date,
    freq,
    time_zone,
    user

    /reminder
      /new [post]
        body {
          title
          text
          start_date
          freq
          user
        }
      /update/:reminderID [post]
        body {
          title
          text
          start_date
          freq
          user
        }
      /delete/:reminderID [get]
      /all/:userID [get]  
*/


router.post('/new', [
  body('title').notEmpty().trim().escape(),
  body('text').notEmpty().trim().escape(),
  body('start_date').notEmpty().trim().escape(),
  body('freq').notEmpty(),
  body('user').notEmpty()
], async (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(`Errors:`)
    console.log(errors.array())
    return res.status(400).json({ errors: errors.array() });
  }

  const time_zone = await DBHandler.getUserTimeZone(req.body.user)
  const newReminder = {
    title: req.body.title,
    user: req.body.user,
    start_date: req.body.start_date,
    freq: req.body.freq,
    time_zone: time_zone,
    text: req.body.text
  }

  const message = await DBHandler.createNewReminder(newReminder)
  if(message.type === 'SUCCESS') {
    Scheduler.scheduleReminder(message.reminder)
    res.status(200).send(message.message)
  } else {
    res.status(400).send(message.message)
  }

})

router.post('/update/:reminderId', [
  body('title').notEmpty().trim().escape(),
  body('text').notEmpty().trim().escape(),
  body('start_date').notEmpty().trim().escape(),
  body('freq').notEmpty()
], async (req, res, next) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(`Errors:`)
    console.log(errors.array())
    return res.status(400).json({ errors: errors.array() });
  }

  const remId = req.params.reminderId;
  const time_zone = await DBHandler.getUserTimeZone(req.body.user)
  const updatedRem = {
    'title': req.body.title,
    'start_date': req.body.start_date,
    'freq': req.body.freq,
    'text': req.body.text,
    'time_zone': time_zone
  }

  Scheduler.stopScheduler(remId)
  const message = await DBHandler.updateReminder(remId, updatedRem)
  console.log(message)
  let reminder = await DBHandler.getReminderById(remId)
  console.log(`reminder from db`)
  console.log(reminder)
  let srem = await Scheduler.scheduleReminder(reminder)
  console.log(`res from schedule reminder`)
  console.log(srem)
  if(message.type === 'SUCCESS') {
    res.status(200).send(message.message)
  } else {
    res.status(400).send(message.message)
  }

})

router.get('/delete/:reminderID', async (req, res, next) => {
  const remId = req.params.reminderID;
  const message = await DBHandler.deleteReminder(remId)
  Scheduler.stopScheduler(remId)
  res.status(200).send(message.message)
})

router.get('/all/:user', async (req, res, next) => {

  // console.log(req.params)

  let user = req.params.user

  try {
    if(req.params.user !== 'undefined' && req.params.user !== undefined) {
      const message = await DBHandler.getRemindersByUser(user)

      if(message.type === 'SUCCESS') {
        res.status(200).send(message.reminders)
      } else {
        throw message.message
      }

    } else throw 'User not defined'
  } catch (err) {
    console.log(err)
    res.status(400).send({
      type: "ERROR",
      message: err
    })
  }

})

module.exports = router;