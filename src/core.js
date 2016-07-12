var _ = require('lodash');

var utils = require('./utils');
var CONSTANTS = require('./constants');
var DAY_KEYS = CONSTANTS.DAY_KEYS;
var WORK_TODAY = CONSTANTS.WORK_TODAY;
var WORK_EVERYDAY = CONSTANTS.WORK_EVERYDAY;
var WORK_24x7 = CONSTANTS.WORK_24x7;
var WORK_NOT_WORKING = CONSTANTS.WORK_NOT_WORKING;

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

    // Если для текущего времени нашелся рабочий интервал, значит открыто. Иначе закрыто.
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
