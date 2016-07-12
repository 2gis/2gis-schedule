var _ = require('lodash');
var CONSTANTS = require('./constants');
var DAY_KEYS = CONSTANTS.DAY_KEYS;
var MIDNIGHT = '00:00';

const BREAK_LUNCH = CONSTANTS.BREAK_LUNCH;
const BREAK_REST = CONSTANTS.BREAK_REST;

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
    var interval = _.findLast(working_hours, function(interval) {
        return interval.from > interval.to;
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
    return _.find(intervals, function(interval) {
        return isTimeInInterval(time, interval)
    });
}
exports.findInterval = findInterval;

/**
 * Returns true, if schedule the same for every day
 * @param  {Object} schedule
 * @return {Boolean}
 */
function isEveryDay(schedule) {
    return !_.some(DAY_KEYS.slice(1), function(key) {
        return !_.isEqual(schedule[key], schedule[DAY_KEYS[0]]);
    });
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
    return _.reduce(working_hours, function(breaks, interval) {
        const last = _.last(breaks);
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
