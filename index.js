var core = require('./src/core');
var utils = require('./src/utils');

exports.isOpened = core.isOpened;
exports.is24x7 = core.is24x7;
exports.isEveryDay = utils.isEveryDay;

exports.getTodayWorktime = core.getTodayWorktime;

exports.getBreakHours = core.getBreakHours;

exports.getStatus = core.getStatus;
