var CONSTANTS = require('./constants');
var DAY_KEYS = CONSTANTS.DAY_KEYS;
var MIDNIGHT = '00:00';

var MINUTES_IN_HOUR = 60;
var MINUTES_IN_DAY = 60 * 24;

var BREAK_LUNCH = CONSTANTS.BREAK_LUNCH;
var BREAK_REST = CONSTANTS.BREAK_REST;

var EVENT_OPEN = CONSTANTS.EVENT_OPEN;
var EVENT_CLOSE = CONSTANTS.EVENT_CLOSE;

/**
 * Returns key for next day with offset from current day
 * Возвращает ключ дня через offset дней после сегодняшнего
 * @param  {String} day - current day
 * @param  {Number} offset (positive number)
 * @return {String}
 */
function getDayFromToday(day, offset) {
    return DAY_KEYS[(DAY_KEYS.indexOf(day) + offset) % 7];
}
exports.getDayFromToday = getDayFromToday;

/**
 * Returns interval that intersect current day with next day.
 * For schedule '10:00–13:00, 14:00–02:00' returns '00:00–02:00'
 * @param  {Object[]} working_hours
 * @return {Object}
 */
function getOverlappingWorkingHours(working_hours) {
    var interval;

    // findLast
    (working_hours || []).forEach(function(currentInterval) {
        if (currentInterval.from > currentInterval.to) {
            interval = currentInterval;
        }
    });

    if (interval) {
        return {
            from: MIDNIGHT,
            to: interval.to
        };
    }

    return null;
}
exports.getOverlappingWorkingHours = getOverlappingWorkingHours;

/**
 * Checks interval contains passed time
 * @param  {String}  time
 * @param  {Object}  interval
 * @return {Boolean}
 */
function isTimeInInterval(time, interval) {
    var from = interval.from;
    // 23:00–00:30 --> 23:00–24:30
    var to = interval.to > interval.from ? interval.to : add24h(interval.to);
    return (time >= from && time < to);
}

/**
 * '01:10' --> '25:10'
 * @param  {String} time
 * @return {String}
 */
function add24h(time) {
    var parts = time.split(':');
    return Number(parts[0]) + 24 + ':' + parts[1];
}

/**
 * Returns interval, that contents passed time
 * @param  {Object[]} intervals - array of intervals
 * @param  {String} time
 * @return {Object}
 */
function findInterval(intervals, time) {
    var interval;

    intervals.forEach(function(currentInterval) {
        if (interval) {
            return;
        }

        if(isTimeInInterval(time, currentInterval)) {
            interval = currentInterval;
        }
    });

    return interval;
}
exports.findInterval = findInterval;

/**
 * Returns true, if schedule the same for every day
 * @param  {Object} schedule
 * @return {Boolean}
 */
function isEveryDay(schedule) {
    var worksEveryDay = true;
    var day0 = JSON.stringify(schedule[DAY_KEYS[0]]);

    DAY_KEYS.slice(1).forEach(function(day){
        if (JSON.stringify(schedule[day]) != day0) {
            worksEveryDay = false;
        }
    });

    return worksEveryDay;
}
exports.isEveryDay = isEveryDay;

/**
 * Returns array of breaks between work time intervals
 * If work time is: [{ from: '08:00', to: '13:00' }, { from: '14:00', to: '17:45' }, { from: '18:00', to: '20:00' }]
 * Breaks will be [{ from: '13:00', to: '14:00' }, { from: '17:45', to: '18:00' }]
 * @param  {Object} working_hours
 * @return {Array}
 */
function getBreakHours(working_hours) {
    return (working_hours || []).reduce(function(breaks, interval) {
        var last = breaks[breaks.length - 1];
        // beginning (from) of each new work time interval is the end of break,
        // we add to the last break this beginning (to)
        if (last) {
            last.to = interval.from;
        }
        // end (to) of each work time interval is the beginning (from) of the next break,
        // we add new brake to array
        return breaks.concat({from: interval.to});
    }, []).slice(0, -1); // removing last (not closed) break
}
exports.getBreakHours = getBreakHours;

/**
 * Returns type of break. Break for lunch, or other break
 * 13:00–14:00 --> lunch
 * 17:00—17:45 --> break
 * @param  {Object} interval
 * @param  {String} interval.from - break beginning
 * @param  {String} interval.to - break end
 * @return {String}
 */
function getBreakType(interval) {
    const to = interval.to != MIDNIGHT ? interval.to : add24h(interval.to); // 00:00 --> 24:00

    return interval.from >= '12:00' && to <= '16:00' ? BREAK_LUNCH : BREAK_REST;
}
exports.getBreakType = getBreakType;

/**
 * Returns break time between events
 * @param  {Object} event1 - first event
 * @param  {Object} event2 - next event
 * @return {String}
 */
function getBreakTypeBetweenEvents(event1, event2) {
    // If days different it isn't common break
    if (event1.dayOffset != event2.dayOffset) {
        return null;
    }

    return getBreakType({
        from: event1.time,
        to: event2.time
    });
}
exports.getBreakTypeBetweenEvents = getBreakTypeBetweenEvents;


/**
 * Returns array of interval events — openings and closings
 * @param  {Object} [interval]
 * @return {[{type: String, time: String, dayOffset: String}]}
 */
function splitIntervalToEvents(interval) {
    if (!interval) {
        return [];
    }

    var over = interval.to < interval.from; // interval cross midnight

    return [
        {
            type: EVENT_OPEN,
            time: interval.from,
            dayOffset: (interval.dayOffset || 0)
        },
        {
            type: EVENT_CLOSE,
            time: interval.to,
            dayOffset: (interval.dayOffset || 0) + Number(over)
        }
    ];
}
exports.splitIntervalToEvents = splitIntervalToEvents;

/**
 * Gap between two timestamps with dayOffset in minutes
 * @param  {String} fromTime
 * @param  {String} toTime
 * @param  {Number} dayOffset
 * @return {Number}
 */
function timeTo(fromTime, toTime, dayOffset) {
    var from = parseTime(fromTime);
    var to = parseTime(toTime);
    return (to.m - from.m) + (to.h - from.h) * MINUTES_IN_HOUR + dayOffset * MINUTES_IN_DAY;
}
exports.timeTo = timeTo;

/**
 * 01:23 --> { h: 1, m: 23 }
 * @param  {String} time
 * @return {Object}
 */
function parseTime(time) {
    var parts = time.split(':');
    return {
        h: +parts[0],
        m: +parts[1]
    };
}
exports.parseTime = parseTime;

/**
 * Returns working_hours array from schedule for one day
 * @param scheduleForDay - schedule object for one day like this: { working_hours: [{ from: '06:00', to: '07:00' }] }
 * @param defaultValue - what return if schedule id empty
 * @returns {Array|defaultValue}
 */
function getWorkingHours(scheduleForDay, defaultValue) {
    return scheduleForDay && scheduleForDay.working_hours || defaultValue;
}
exports.getWorkingHours = getWorkingHours;
