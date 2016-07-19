var core = require('./src/core');
var utils = require('./src/utils');
var CONSTANTS = require('./src/constants');

exports.isOpened = core.isOpened;
exports.is24x7 = core.is24x7;
exports.isEveryDay = utils.isEveryDay;

exports.getTodayWorktime = core.getTodayWorktime;

exports.getTodayBreakHours = core.getTodayBreakHours;

exports.getStatus = core.getStatus;

exports.DAY_KEYS = CONSTANTS.DAY_KEYS;
