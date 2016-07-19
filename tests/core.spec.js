var expect = require("chai").expect;

var core = require('../src/core');

var CONSTANTS = require('../src/constants');

var WORK_TODAY = CONSTANTS.WORK_TODAY;
var WORK_EVERYDAY = CONSTANTS.WORK_EVERYDAY;
var WORK_24x7 = CONSTANTS.WORK_24x7;
var WORK_NOT_WORKING = CONSTANTS.WORK_NOT_WORKING;

var EVENT_OPEN = CONSTANTS.EVENT_OPEN;
var EVENT_CLOSE = CONSTANTS.EVENT_CLOSE;

var BREAK_LUNCH = CONSTANTS.BREAK_LUNCH;
var BREAK_REST = CONSTANTS.BREAK_REST;

var STATUS_OPENED = CONSTANTS.STATUS_OPENED;
var STATUS_WILL_CLOSE_IN_TIME_FOR_BREAK = CONSTANTS.STATUS_WILL_CLOSE_IN_TIME_FOR_BREAK;
var STATUS_WILL_CLOSE_IN_TIME = CONSTANTS.STATUS_WILL_CLOSE_IN_TIME;

var STATUS_WILL_OPEN_AT_TIME = CONSTANTS.STATUS_WILL_OPEN_AT_TIME;
var STATUS_WILL_OPEN_AT_DAY_AT_TIME = CONSTANTS.STATUS_WILL_OPEN_AT_DAY_AT_TIME;
var STATUS_WILL_OPEN_TOMORROW_AT_TIME = CONSTANTS.STATUS_WILL_OPEN_TOMORROW_AT_TIME;
var STATUS_WILL_OPEN_DAY_AFTER_TOMORROW_AT_TIME = CONSTANTS.STATUS_WILL_OPEN_DAY_AFTER_TOMORROW_AT_TIME;

var STATUS_WILL_OPEN_IN_TIME = CONSTANTS.STATUS_WILL_OPEN_IN_TIME;

var STATUS_WILL_OPEN_IN_TIME_FROM_BREAK = CONSTANTS.STATUS_WILL_OPEN_IN_TIME_FROM_BREAK;
var STATUS_WILL_OPEN_AT_TIME_FROM_BREAK = CONSTANTS.STATUS_WILL_OPEN_AT_TIME_FROM_BREAK;



describe('core', function() {
    describe('is24x7', function() {
        var goodDay = {working_hours: [ {from: '00:00', to: '24:00'}]};
        var schedule = {
            Sun: goodDay,
            Mon: goodDay,
            Tue: goodDay,
            Wed: goodDay,
            Thu: goodDay,
            Fri: goodDay,
            Sat: goodDay
        };

        it('allDay', function() {
            expect(core.is24x7(schedule)).to.equal(true);
        });

        it('notAllDay', function() {
            schedule.Sat.working_hours = [{from: '00:08', to: '20:00'}];
            expect(core.is24x7(schedule)).to.equal(false);
        });
    });

    describe('isOpened', function() {
        it('current day', function() {
            var schedule = {
                Mon: {
                    working_hours: [
                        { from: '08:00', to: '13:00' },
                        { from: '14:00', to: '17:15' }
                    ]
                }
            };

            expect(core.isOpened(schedule, { day: 'Mon', time: '07:59' })).to.equal(false);
            expect(core.isOpened(schedule, { day: 'Mon', time: '08:00' })).to.equal(true);
            expect(core.isOpened(schedule, { day: 'Mon', time: '13:00' })).to.equal(false);
            expect(core.isOpened(schedule, { day: 'Mon', time: '14:00' })).to.equal(true);
            expect(core.isOpened(schedule, { day: 'Mon', time: '17:15' })).to.equal(false);
            expect(core.isOpened(schedule, { day: 'Mon', time: '23:00' })).to.equal(false);

            expect(core.isOpened(schedule, { day: 'Tue', time: '09:00' })).to.equal(false);
        });

        it('still open from previous day', function() {
            var schedule = {
                Sun: {
                    working_hours: [
                        { from: '06:00', to: '07:00' },
                        { from: '23:00', to: '00:50' }
                    ]
                },
                Mon: {
                    working_hours: [
                        { from: '08:00', to: '13:00' },
                        { from: '14:00', to: '17:15' }
                    ]
                }
            };

            var stillOpenedTime = { day: 'Mon', time: '00:15' };
            var closedTime = { day: 'Mon', time: '06:30' };

            expect(core.isOpened(schedule, stillOpenedTime)).to.equal(true);
            expect(core.isOpened(schedule, closedTime)).to.equal(false);
        });

        it('work 24x7', function() {
            var day = {
                working_hours: [{ from: '00:00', to: '24:00' }]
            };
            var schedule = {
                Sun: day,
                Mon: day,
                Tue: day,
                Wed: day,
                Thu: day,
                Fri: day,
                Sat: day
            };

            expect(core.isOpened(schedule, { day: 'Mon', time: '00:15' })).to.equal(true);
        });
    });

    it('getTodayWorktime', function() {
        var dayA = function() {
            return {
                working_hours: [
                    { from: '06:00', to: '07:00' },
                    { from: '23:00', to: '00:50' }
                ]
            }
        };

        var dayB = function() {
            return {
                working_hours: [
                    { from: '08:00', to: '13:00' },
                    { from: '14:00', to: '17:15' }
                ]
            }
        };

        var day24x7 = function() {
            return {
                working_hours: [
                    { from: '00:00', to: '24:00' }
                ]
            }
        };

        var schedulesAndNowsAndExpectedTypes = [{
            schedule: { Mon: dayA(), Tue: dayA(), Wed: dayA(), Thu: dayA(), Fri: dayA() },
            now: { day: 'Mon', time: '10:00' },

            expected: { type: WORK_TODAY, intervals: dayA().working_hours }
        }, {
            schedule: { Mon: dayA(), Tue: dayA(), Wed: dayA(), Thu: dayA(), Fri: dayA() },
            now: { day: 'Sat', time: '10:00' },

            expected: { type: WORK_NOT_WORKING }
        }, {
            schedule: { Mon: day24x7(), Tue: day24x7(), Wed: day24x7(), Thu: day24x7(),
                Fri: day24x7(), Sat: day24x7(), Sun: day24x7() },
            now: { day: 'Mon', time: '10:00' },

            expected: { type: WORK_24x7 }
        }, {
            schedule: { Mon: dayA(), Tue: dayA(), Wed: dayA(), Thu: dayA(), Fri: dayA(), Sat: dayA(), Sun: dayA() },
            now: { day: 'Mon', time: '10:00' },

            expected: { type: WORK_EVERYDAY, intervals: dayA().working_hours }
        }, {
            schedule: { Mon: dayA(), Tue: dayA(), Wed: dayA(), Thu: dayA(), Fri: dayA(), Say: dayB(), Sun: dayB() },
            now: { day: 'Mon', time: '10:00' },

            expected: { type: WORK_TODAY, intervals: dayA().working_hours }
        }];

        schedulesAndNowsAndExpectedTypes.forEach(function(testCase) {
            expect(core.getTodayWorktime(testCase.schedule, testCase.now)).to.deep.equal(testCase.expected);
        });
    });


    describe('getNextEvent', function() {
        it('Lot of work time intervals', function() {
            var schedule = {
                Sun: {
                    working_hours: [
                        { from: '06:00', to: '07:00' },
                        { from: '23:00', to: '00:50' }
                    ]
                },
                Mon: {
                    working_hours: [
                        { from: '08:00', to: '13:00' },
                        { from: '14:00', to: '17:15' }
                    ]
                }
            };

            var nowsAndExpectedNextEvents = [{
                now: { day: 'Mon', time: '00:05' },
                expected: [
                    { type: EVENT_CLOSE, time: '00:50', dayOffset: 0 },
                    { type: EVENT_OPEN, time: '08:00', dayOffset: 0 }
                ]
            }, {
                now: { day: 'Mon', time: '01:00' },
                expected: [
                    { type: EVENT_OPEN, time: '08:00', dayOffset: 0 },
                    { type: EVENT_CLOSE, time: '13:00', dayOffset: 0 }
                ]
            }, {
                now: { day: 'Mon', time: '09:00' },
                expected: [
                    { type: EVENT_CLOSE, time: '13:00', dayOffset: 0 },
                    { type: EVENT_OPEN, time: '14:00', dayOffset: 0 }
                ]
            }, {
                now: { day: 'Mon', time: '17:15' },
                expected: [
                    { type: EVENT_OPEN, time: '06:00', dayOffset: 6 },
                    { type: EVENT_CLOSE, time: '07:00', dayOffset: 6 }
                ]
            }];


            nowsAndExpectedNextEvents.forEach(function(testCase) {
                expect(core.getNextEvents(schedule, testCase.now)).to.deep.equal(testCase.expected);
            });
        });

        it('Works once a week', function() {
            var schedule = {
                Sun: {
                    working_hours: [
                        { from: '06:00', to: '07:00' }
                    ]
                }
            };

            var now = { day: 'Sun', time: '07:05'};

            var expected = [
                { type: EVENT_OPEN, time: '06:00', dayOffset: 7 },
                { type: EVENT_CLOSE, time: '07:00', dayOffset: 7 }
            ];
            expect(core.getNextEvents(schedule, now)).to.deep.equal(expected);
        });
    });

    it('getTodayBreakHours', function() {
        var schedule = {
            Mon: {working_hours: [{ from: '08:00', to: '20:00' }]},
            Tue: {working_hours: [{ from: '08:00', to: '13:00' }, { from: '14:00', to: '20:00' }]},
            Sun: {working_hours: [{ from: '13:00', to: '19:00' }]},
        };

        expect(core.getTodayBreakHours(schedule, {day: 'Mon'})).to.deep.equal([]);
        expect(core.getTodayBreakHours(schedule, {day: 'Fri'})).to.deep.equal([]);
        expect(core.getTodayBreakHours(schedule, {day: 'Tue'})).to.deep.equal([{ from: '13:00', to: '14:00' }]);
    });

    describe('getStatus', function() {
        var schedule = {
            Sun: {
                working_hours: [
                    { from: '06:00', to: '07:00' },
                    { from: '23:00', to: '00:50' }
                ]
            },
            Mon: {
                working_hours: [
                    { from: '08:00', to: '13:00' },
                    { from: '14:00', to: '17:15' }
                ]
            }
        };

        var nowsAndExpectedStatuses = [{
            now: { day: 'Mon', time: '08:00' },
            expected: { type: STATUS_OPENED }
        }, {
            now: { day: 'Sun', time: '05:00' },
            expected: { type: STATUS_WILL_OPEN_AT_TIME, time: '06:00' }
        }, {
            now: { day: 'Sun', time: '05:01' },
            expected: { type: STATUS_WILL_OPEN_IN_TIME, minutesTo: 59 }
        }, {
            now: { day: 'Sun', time: '05:59' },
            expected: { type: STATUS_WILL_OPEN_IN_TIME, minutesTo: 1 }
        }, {
            now: { day: 'Sun', time: '13:13' },
            expected: { type: STATUS_WILL_OPEN_AT_TIME_FROM_BREAK, time: '23:00', breakType: BREAK_REST }
        }, {
            now: { day: 'Sun', time: '22:50' },
            expected: { type: STATUS_WILL_OPEN_IN_TIME_FROM_BREAK, minutesTo: 10, breakType: BREAK_REST }
        }, {
            now: { day: 'Sun', time: '22:59' },
            expected: { type: STATUS_WILL_OPEN_IN_TIME_FROM_BREAK, minutesTo: 1, breakType: BREAK_REST }
        }, {
            now: { day: 'Mon', time: '17:16' },
            expected: { type: STATUS_WILL_OPEN_AT_DAY_AT_TIME, day: 'Sun', time: '06:00' }
        }, {
            now: { day: 'Sat', time: '17:16' },
            expected: { type: STATUS_WILL_OPEN_TOMORROW_AT_TIME, time: '06:00' }
        }, {
            now: { day: 'Fri', time: '17:16' },
            expected: { type: STATUS_WILL_OPEN_DAY_AFTER_TOMORROW_AT_TIME, time: '06:00' }
        }, {
            now: { day: 'Mon', time: '17:14' },
            expected: { type: STATUS_WILL_CLOSE_IN_TIME, minutesTo: 1, breakType: null }
        }, {
            now: { day: 'Mon', time: '12:59' },
            expected: { type: STATUS_WILL_CLOSE_IN_TIME_FOR_BREAK, minutesTo: 1, breakType: BREAK_LUNCH }
        }, {
            now: { day: 'Mon', time: '17:00' },
            expected: { type: STATUS_WILL_CLOSE_IN_TIME, minutesTo: 15, breakType: null }
        }, {
            now: { day: 'Mon', time: '12:01' },
            expected: { type: STATUS_WILL_CLOSE_IN_TIME_FOR_BREAK, minutesTo: 59, breakType: BREAK_LUNCH }
        }, {
            now: { day: 'Mon', time: '12:00' },
            expected: { type: STATUS_OPENED }
        }];

        nowsAndExpectedStatuses.forEach(function(testCase, index) {
            var status = core.getStatus(schedule, testCase.now,  60, ['Sun', 'Sat']);
            it('case #' + (index + 1), function() {
                expect(status.type).to.equal(testCase.expected.type);
                expect(status.time).to.equal(testCase.expected.time);
                expect(status.breakType).to.equal(testCase.expected.breakType, status.type);
            });
        });

        it('Empty schedule', function() {
            expect(core.getStatus([], { day: 'Mon', time: '13:37' }, 60, ['Sun', 'Sat'])).to.be.an('null');
        });

        it('24x7', function() {
            var goodDay = {working_hours: [ {from: '00:00', to: '24:00'}]};
            var schedule = {
                Sun: goodDay,
                Mon: goodDay,
                Tue: goodDay,
                Wed: goodDay,
                Thu: goodDay,
                Fri: goodDay,
                Sat: goodDay
            };
            expect(core.getStatus(schedule, { day: 'Mon', time: '13:37' }, 60, ['Sun', 'Sat']))
                .to.deep.equal({ type: STATUS_OPENED });
        });
    });
});
