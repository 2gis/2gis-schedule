var _ = require('lodash');

var utils = require('./utils');
var CONSTANTS = require('./constants');
var DAY_KEYS = CONSTANTS.DAY_KEYS;

var WORK_TODAY = CONSTANTS.WORK_TODAY;
var WORK_EVERYDAY = CONSTANTS.WORK_EVERYDAY;
var WORK_24x7 = CONSTANTS.WORK_24x7;
var WORK_NOT_WORKING = CONSTANTS.WORK_NOT_WORKING;

var EVENT_CLOSE = CONSTANTS.EVENT_CLOSE;

var STATUS_OPENED = CONSTANTS.STATUS_OPENED;
var STATUS_WILL_CLOSE_IN_MINUTE_FOR_BREAK = CONSTANTS.STATUS_WILL_CLOSE_IN_MINUTE_FOR_BREAK;
var STATUS_WILL_CLOSE_IN_MINUTE = CONSTANTS.STATUS_WILL_CLOSE_IN_MINUTE;
var STATUS_WILL_CLOSE_IN_TIME_FOR_BREAK = CONSTANTS.STATUS_WILL_CLOSE_IN_TIME_FOR_BREAK;
var STATUS_WILL_CLOSE_IN_TIME = CONSTANTS.STATUS_WILL_CLOSE_IN_TIME;

var STATUS_WILL_OPEN_AT_TIME = CONSTANTS.STATUS_WILL_OPEN_AT_TIME;
var STATUS_WILL_OPEN_AT_DAY_AT_TIME = CONSTANTS.STATUS_WILL_OPEN_AT_DAY_AT_TIME;
var STATUS_WILL_OPEN_TOMORROW_AT_TIME = CONSTANTS.STATUS_WILL_OPEN_TOMORROW_AT_TIME;
var STATUS_WILL_OPEN_DAY_AFTER_TOMORROW_AT_TIME = CONSTANTS.STATUS_WILL_OPEN_DAY_AFTER_TOMORROW_AT_TIME;

var STATUS_WILL_OPEN_IN_MINUTE = CONSTANTS.STATUS_WILL_OPEN_IN_MINUTE;
var STATUS_WILL_OPEN_IN_TIME = CONSTANTS.STATUS_WILL_OPEN_IN_TIME;

var STATUS_WILL_OPEN_IN_MINUTE_FROM_BREAK = CONSTANTS.STATUS_WILL_OPEN_IN_MINUTE_FROM_BREAK;
var STATUS_WILL_OPEN_IN_TIME_FROM_BREAK = CONSTANTS.STATUS_WILL_OPEN_IN_TIME_FROM_BREAK;
var STATUS_WILL_OPEN_AT_TIME_FROM_BREAK = CONSTANTS.STATUS_WILL_OPEN_AT_TIME_FROM_BREAK;

/**
 * Returns working hours for current day with working hours before closing on previous day.
 * @param  {Object} schedule
 * @param  {String} key - day key (Mon/Tue/Wed/...)
 * @return {Object}
 */
function getDayWithOverlap(schedule, key) {
    var prev = utils.getDayFromToday(key, 6);
    var overlap = schedule[prev] && utils.getOverlappingWorkingHours(schedule[prev].working_hours);

    var working_hours = _.get(schedule[key], 'working_hours', []);

    return {
        working_hours: overlap ? [overlap].concat(working_hours) : working_hours
    };
}

/**
 * Open or close?
 * @param  {Object} schedule
 * @param  {Object} now
 * @return {Boolean}
 */
exports.isOpened = function(schedule, now) {
    if (is24x7(schedule)) {
        return true;
    }

    var currentDay = getDayWithOverlap(schedule, now.day);
    var interval = utils.findInterval(currentDay.working_hours, now.time);

    // If for now have interval that opened, else - closed
    return !!interval;
};

/**
 * @param  {Object} schedule
 * @return {Boolean}
 */
function is24x7(schedule) {
    return !_.find(DAY_KEYS, function(key) {
            var interval = _.get(schedule[key], ['working_hours', 0]);
            return !(interval && interval.from == '00:00' && interval.to == '24:00');
        });
}
exports.is24x7 = is24x7;



/**
 * Returns today worktime and it's type
 * Type: "24x7", "all day the same", or "today".
 * @param  {Object} schedule
 * @param  {Object} now
 * @return {Object}
 */
function getTodayWorktime(schedule, now) {
    if (is24x7(schedule)) {
        return {
            type: WORK_24x7
        };
    }

    var today = schedule[now.day];

    if (!today) {
        return {
            type: WORK_NOT_WORKING
        };
    }

    return {
        type: utils.isEveryDay(schedule) ? WORK_EVERYDAY : WORK_TODAY,
        intervals: today.working_hours
    };
}
exports.getTodayWorktime = getTodayWorktime;

/**
 * Returns array of breaks for today
 * @param  {Object} schedule
 * @param  {Object} now
 * @return {Array}
 */
function getTodayBreakHours(schedule, now) {
    return utils.getBreakHours(_.get(schedule[now.day], 'working_hours'));
}
exports.getTodayBreakHours = getTodayBreakHours;

/**
 * Search next 2 events (open/close) and their time
 * @param  {Object} schedule
 * @param  {Object} now
 * @return {Object}
 */
function getNextEvents(schedule, now) {
    // Build new array, that starts from today and ends the same day in next week
    // For friday it will be like this ['Fri', 'Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    // Second friday need for case when firm works only on Friday for looking next event in this day
    var nowDayIndex = DAY_KEYS.indexOf(now.day);
    var keysFromToday = [].concat(DAY_KEYS.slice(nowDayIndex), DAY_KEYS.slice(0, nowDayIndex + 1));

    // We need take events from yesterday that happens today
    var yesterdayKey = utils.getDayFromToday(now.day, 6);
    var yesterdayWorkingHours = _.get(schedule[yesterdayKey], 'working_hours');
    var yesterdayEvents = utils.splitIntervalToEvents(
        utils.getOverlappingWorkingHours(yesterdayWorkingHours)
    );

    return _.chain(keysFromToday)
        // Sorting schedule
        .map(function(key) {
            return schedule[key];
        })
        // Adding offset from today to have this information after flatten
        .map(function(day, index) {
            return _.map(_.get(day, 'working_hours'),
            function(interval) {
                return _.assign({}, interval, { dayOffset: index });
            })
        })
        .flatten()
        // Transform each interval in two events: closing and opening
        .reduce(function(events, interval) {
            return events.concat(utils.splitIntervalToEvents(interval))
        }, _.tail(yesterdayEvents))
        // Left only events, that will happen after now
        .filter(function(event) {
            return event.dayOffset > 0 || event.time > now.time;
        })
        // Take only 2 (lazy lodash will no filter all)
        .take(2)
        .value();
}
exports.getNextEvents = getNextEvents;


/**
 * State of the schedule with forecast like this:
 * "Will open tomorrow at 10:00" / "Will open on Monday at 8:00" but in object with constants instead of text
 * @param  {Object} schedule
 * @param  {Object} now
 * @param  {Number} forecastThreshold - how max minutes should left when we should say about next event (open / close)
 * @param  {[String]} weekends - days that usually is day off ['Sat', 'Sun']
 * @return {Object}
 */
function getStatus(schedule, now, forecastThreshold, weekends) {
    if (is24x7(schedule)) {
        return {
            type: STATUS_OPENED
        };
    }

    var nextStatusChangeEvents = getNextEvents(schedule, now);

    if (nextStatusChangeEvents.length < 2) {
        return null;
    }

    var next = nextStatusChangeEvents[0];
    var overnext = nextStatusChangeEvents[1];
    var minutesTo = utils.timeTo(now.time, next.time, next.dayOffset);
    var breakType;

    // If open now and will close
    if (next.type == EVENT_CLOSE) {
        // If enough time before closing only say that opened
        if (minutesTo >= forecastThreshold) {
            return {
                type: STATUS_OPENED
            };
        }
        // If break/lunch near say what type of break it will be
        breakType = utils.getBreakTypeBetweenEvents(next, overnext);

        if (minutesTo <= 1) {
            return {
                type: breakType ? STATUS_WILL_CLOSE_IN_MINUTE_FOR_BREAK : STATUS_WILL_CLOSE_IN_MINUTE,
                breakType: breakType
            };
        }

        return {
            type: breakType ? STATUS_WILL_CLOSE_IN_TIME_FOR_BREAK : STATUS_WILL_CLOSE_IN_TIME,
            breakType: breakType,
            minutesTo: minutesTo
        };
    }

    // next.type == EVENT_OPEN
    var days = next.dayOffset; // days before opening
    var isWeekendToday = _.includes(weekends, now.day); // if it is day off today

    // will open today (first open or from break)
    if (days == 0) {
        var breakhours = getTodayBreakHours(schedule, now);
        var currentBreak = utils.findInterval(breakhours, now.time);
        breakType = currentBreak && utils.getBreakType(currentBreak);


        // If too much time before opening say in what time will be this opening (not how much left before)
        if (minutesTo >= forecastThreshold) {
            return {
                type: breakType ? STATUS_WILL_OPEN_AT_TIME_FROM_BREAK : STATUS_WILL_OPEN_AT_TIME,
                breakType: breakType,
                time: next.time
            };
        }

        if (minutesTo <= 1) {
            return {
                type: breakType ? STATUS_WILL_OPEN_IN_MINUTE_FROM_BREAK : STATUS_WILL_OPEN_IN_MINUTE,
                breakType: breakType
            };
        }

        return {
            type: breakType ? STATUS_WILL_OPEN_IN_TIME_FROM_BREAK : STATUS_WILL_OPEN_IN_TIME,
            breakType: breakType,
            minutesTo: minutesTo
        };
    }

    // will open tomorrow
    if (days == 1) {
        return {
            type: STATUS_WILL_OPEN_TOMORROW_AT_TIME,
            time: next.time
        };
    }

    // will open the day after tomorrow
    if (days == 2 && !isWeekendToday) {
        return {
            type: STATUS_WILL_OPEN_DAY_AFTER_TOMORROW_AT_TIME,
            time: next.time
        };
    }

    // will open after 2+ days
    return {
        type: STATUS_WILL_OPEN_AT_DAY_AT_TIME,
        day: utils.getDayFromToday(now.day, next.dayOffset),
        time: next.time
    };
}
exports.getStatus = getStatus;

