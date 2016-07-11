var expect = require("chai").expect;

var core = require('../src/core');

var CONSTANTS = require('../src/constants');

var WORK_TODAY = CONSTANTS.WORK_TODAY;
var WORK_EVERYDAY = CONSTANTS.WORK_EVERYDAY;
var WORK_24x7 = CONSTANTS.WORK_24x7;
var WORK_NOT_WORKING = CONSTANTS.WORK_NOT_WORKING;


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

});
