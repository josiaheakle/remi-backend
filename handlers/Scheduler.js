var schedule = require('node-schedule');
let moment = require('moment-timezone');

const VonageHandler = require('./VonageHandler');
const DBHandler = require('./DBHandler.js');


const Scheduler = (() => {

    let _activeJobs = [];

    const _getNextDate = (reminder) => {

        let newDate = moment(reminder.next_date);

        switch(reminder.freq) {
            case(`Once`):
                return
            case('Daily'):
                newDate.add(1, 'days')
                break;
            case('Weekly'):
                newDate.add(1, 'weeks')
                break;
            case('Bi-Weekly'):
                newDate.add(2, 'weeks')
                break;
            case('Monthly'):
                newDate.add(1, 'months')
                break;
            case('Yearly'):
                newDate.add(1, 'years')
                break;
        }

        return newDate.format();

    }

    const _getValidNextDate = async (reminder) => {
        let newReminder = reminder;
        let nextDate = moment(reminder.next_date).format();
        let currentDateTime = moment().format();
        if(reminder.freq !== "Once") {

            while(moment(nextDate).isBefore(currentDateTime)) {
                nextDate = _getNextDate(newReminder)
                newReminder.next_date = nextDate;

            }
        } else {
            if(moment(newReminder.next_date).isBefore(currentDateTime)) {
                DBHandler.deleteReminder(reminder._id)
            } else {
                return newReminder
            }
        }

        return newReminder;

    }

    
    const stopScheduler = (reminderId) => {

        console.log(`cancel job called`)

        console.log(`active jobs : `, _activeJobs)

        _activeJobs.forEach(job => {
            if(job.id === reminderId) {
                job.job.stop()
                console.log('canceling job')
            }
        })

    }

    const scheduleAllReminders = (reminderArray) => {
        reminderArray.forEach(reminder => {
            scheduleReminder(reminder)
        })

    }

    const scheduleReminder = async (reminder) => {

        console.log(`scheduling reminder`)
        console.log(reminder)

        const dateAndTime = reminder.next_date.split('T')
        const reminderDate = moment.tz(`${dateAndTime[0]} ${dateAndTime[1]}`, reminder.time_zone).format()

        let newReminder = reminder
        newReminder.next_date = reminderDate

        
        newReminder = await _getValidNextDate(newReminder)
        console.log(`newReminder with nextdate`)
        console.log(newReminder)
        let updatedRes = await DBHandler.updateReminderNextDate(reminder._id, newReminder)

        console.log(`next date updated`)
        console.log(updatedRes)

        let scheduleTime = moment(newReminder.next_date).toDate()

        let job = schedule.scheduleJob(scheduleTime, () => {
            VonageHandler.sendReminder(newReminder)
            setTimeout(() => {
                scheduleReminder(newReminder)
            }, 1000)
        });

        _activeJobs.push({
            id: reminder._id,
            job: job
        })

        return {
            type: "SUCCESS",
            message: "Scheduled reminder."
        }
    }

    return {
        stopScheduler: stopScheduler,
        scheduleReminder: scheduleReminder,
        scheduleAllReminders: scheduleAllReminders
    }

})();

module.exports = Scheduler;