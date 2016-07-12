var expect = require("chai").expect;

var utils = require('../src/utils');

var CONSTANTS = require('../src/constants');
const BREAK_LUNCH = CONSTANTS.BREAK_LUNCH;
const BREAK_REST = CONSTANTS.BREAK_REST;

describe('utils', function () {
    it('getDayFromToday', function() {
        expect(utils.getDayFromToday('Mon', 1)).to.equal('Tue');
        expect(utils.getDayFromToday('Mon', 6)).to.equal('Sun');
    });

    it('getOverlappingWorkingHours', function() {
        var working_hours = [{from: '12:00', to: '16:00'}, {from: '18:00', to: '02:00'}];
        expect(utils.getOverlappingWorkingHours(working_hours)).to.deep.equal({from: '00:00', to: '02:00'});
    });

    it('findInterval', function() {
        var intervals = [{from: '12:00', to: '16:00'}, {from: '18:00', to: '02:00'}];
        expect(utils.findInterval(intervals, '00:00')).to.be.an('undefined');
        expect(utils.findInterval(intervals, '01:00')).to.be.an('undefined');
        expect(utils.findInterval(intervals, '11:00')).to.be.an('undefined');
        expect(utils.findInterval(intervals, '12:00')).to.deep.equal({from: '12:00', to: '16:00'});
        expect(utils.findInterval(intervals, '16:00')).to.be.an('undefined');
        expect(utils.findInterval(intervals, '16:01')).to.be.an('undefined');
        expect(utils.findInterval(intervals, '18:00')).to.deep.equal({from: '18:00', to: '02:00'});
    });

    it('isEveryDay', function() {
        // функции для того, чтобы ссылки на объекты не совпадали
        var dayA = function(){
            return {
                working_hours: [
                    { from: '06:00', to: '07:00' },
                    { from: '23:00', to: '00:50' }
                ]
            }
        };

        var dayB = function(){
            return {
                working_hours: [
                    { from: '08:00', to: '13:00' },
                    { from: '14:00', to: '17:15' }
                ]
            }
        };

        var schedulesAndExpectedTypes = [{
            schedule: { Mon: dayA(), Tue: dayA(), Wed: dayA(), Thu: dayA(), Fri: dayA() },
            expected: false
        }, {
            schedule: { Mon: dayA(), Tue: dayA(), Wed: dayA(), Thu: dayA(), Fri: dayA(), Sat: dayA(), Sun: dayA() },
            expected: true
        }, {
            schedule: { Mon: dayA(), Tue: dayA(), Wed: dayA(), Thu: dayA(), Fri: dayA(), Say: dayB(), Sun: dayB() },
            expected: false
        }];

        schedulesAndExpectedTypes.forEach(function(testCase) {
            expect(utils.isEveryDay(testCase.schedule)).to.equal(testCase.expected);
        });
    });


    it('getBreakHours', function() {
        var workingHoursAndExpectedBreaks = [{
            working_hours: [],
            expected: []
        }, {
            working_hours: [{ from: '08:00', to: '20:00' }],
            expected: []
        }, {
            working_hours: [{ from: '08:00', to: '13:00' }, { from: '14:00', to: '20:00' }],
            expected: [{ from: '13:00', to: '14:00' }]
        }, {
            working_hours: [{ from: '08:00', to: '13:00' }, { from: '14:00', to: '17:45' },
                { from: '18:00', to: '20:00' }],
            expected: [{ from: '13:00', to: '14:00' }, { from: '17:45', to: '18:00' }]
        }];

        workingHoursAndExpectedBreaks.forEach(function(testCase) {
            expect(utils.getBreakHours(testCase.working_hours)).to.deep.equal(testCase.expected);
        });
    });

    it('getBreakType', function() {
        expect(utils.getBreakType({from: '11:00', to: '11:01'})).to.equal(BREAK_REST, '#1');
        expect(utils.getBreakType({from: '13:00', to: '14:00'})).to.equal(BREAK_LUNCH, '#2');
        expect(utils.getBreakType({from: '12:00', to: '16:00'})).to.equal(BREAK_LUNCH, '#3');
        expect(utils.getBreakType({from: '15:00', to: '16:01'})).to.equal(BREAK_REST, '#4');
        expect(utils.getBreakType({from: '23:00', to: '00:00'})).to.equal(BREAK_REST, '#5');
    });
});
