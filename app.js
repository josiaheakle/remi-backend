var path = require('path');
var logger = require('morgan');
var express = require('express');
var cors = require('cors');
var createError = require('http-errors');
var cookieParser = require('cookie-parser');

let userRoute = require('./routes/userApi.js')
let reminderRoute = require('./routes/reminderApi.js')
let verifyRoute = require('./routes/verifyApi.js');
const DBHandler = require('./handlers/DBHandler.js');
const Scheduler = require('./handlers/Scheduler.js');


var app = express();
let port = (process.env.PORT || 4000)

app.use(cors())
app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));
app.get('/favicon.ico', (req, res) => res.status(204));

app.listen(port, () => {
  console.log(`listening on http://localhost:${port}`)
})

app.use('/test', (req, res) => {
  res.send(`hello`)
})

app.use('/user', userRoute)
app.use('/verify', verifyRoute)
app.use('/reminder', reminderRoute)

let scheduleAllReminders = (async () => {
  let allrems = await DBHandler.getAllReminders()
  let res = Scheduler.scheduleAllReminders(allrems)
})();

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).send(err);
});

module.exports = app;
