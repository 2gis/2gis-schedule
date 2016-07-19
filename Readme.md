[![Build Status](https://travis-ci.org/2gis/2gis-schedule.svg?branch=master)](https://travis-ci.org/2gis/2gis-schedule)[![Coverage Status](https://coveralls.io/repos/github/2gis/2gis-schedule/badge.svg?branch=master)](https://coveralls.io/github/2gis/2gis-schedule?branch=master)
#About

It is library for simple work with 2gis schedule. You can get information is organisation work now? When it will open?

There is no build, only lodash in dependency and ECMAScrip 5.1 was used for develop

# Formats

Things that need to understand for using library

## 2GIS schedule format

Looks like this

```javascript
{
    Mon: {
        working_hours: [
            { from: '08:00', to: '13:00' },
            { from: '14:00', to: '17:15' }
        ]
    },
    Tue: {
        working_hours: [
            { from: '08:00', to: '13:00' },
            { from: '14:00', to: '17:15' }
        ]
    },
    Wed: {
        working_hours: [
            { from: '08:00', to: '17:00' }
        ]
    },
    Fri: {
        working_hours: [
            { from: '08:00', to: '17:00' }
        ]
    },
    Sat: {
        working_hours: [
            { from: '10:00', to: '14:00' }
        ]
    }
}
```

It means that organisation works:
* on Monday and Tuesday from 8:00 to 17:15 with brake from 13:00 to 14:00
* on Wednesday and Friday from 8:00 to 17:00
* on Sunday from 10%00 to 14:00
* on Thursday and Saturday don't works

## Now

Way to represent time in which we understand, is this organisation works, or not

```javascript
{
    day: 'Mon',
    time: '12:30'
}
```

In this way we say that we want to know, if organisation works on Monday at 12:30

There is constant `DAY_KEYS` exported by library to convert javascript `Date.getDay()` to correct day.

# Methods

## isOpened(schedule, today)

#### Arguments
* `schedule` - 2gis schedule object
* `today` - object with day description

#### Returns
`Boolean` is organisation open now?

## is24x7(schedule)

#### Arguments
* `schedule` - 2gis schedule object

#### Returns
`Boolean` is organisation works without breaks?

## isEveryDay(schedule)

#### Arguments
* `schedule` - 2gis schedule object

#### Returns
`Boolean` is organisation have the same schedule for all days?

## getTodayWorktime(schedule, now)

#### Arguments
* `schedule` - 2gis schedule object
* `now` - now time moment

#### Returns
`Object` - organisation schedule for today

```javascript
{
    type: WORK_EVERYDAY,
    intervals: { from: '14:00', to: '17:00' }
}
```

Today organisation works from 14:00 to 17:00, in the same days worktime the same

## getBreakHours(schedule, now)

Returns array of breaks between work time intervals
If work time is: `[{ from: '08:00', to: '13:00' }, { from: '14:00', to: '17:45' }, { from: '18:00', to: '20:00' }]`
Breaks will be `[{ from: '13:00', to: '14:00' }, { from: '17:45', to: '18:00' }]`

#### Arguments
* `schedule` - 2gis schedule object
* `now` - now time moment

#### Returns
`Array` - array of organisation breaks for today

## getStatus(schedule, now, forecastThreshold, weekends)

State of the schedule with forecast like this:
"Will open tomorrow at 10:00" / "Will open on Monday at 8:00" but in object with constants instead of text

#### Arguments
* `schedule` - 2gis schedule object
* `now` - now time moment
* `forecastThreshold` - how max minutes should left when we should say about next event (open / close)
* `weekends` - days that usually is day off `['Sat', 'Sun']`


#### Returns
`Object` - Information about schedule

```javascript
{
    type: 'Current status.',
    minutesTo: 'Minutes before next event. Opening or closing.',
    time: 'Time when next event will happened',
    day: 'Day name in what next event will happen if it's not today,
    breakType: 'Type of brake. Lunch or other brake.'
}
```

##### Status list (constants in `/src/constants`):
###### Opened
`OPENED` - firm opened, will not close in near time.

`WILL_CLOSE_IN_TIME_FOR_BREAK` - will close in next `minutesTo` for break `breakType`.

`WILL_CLOSE_IN_TIME` - will close in next `minutesTo`

###### Closed

`WILL_OPEN_AT_TIME` - will open today at `time`

`WILL_OPEN_TOMORROW_AT_TIME` - will open tomorrow at `time`

`WILL_OPEN_DAY_AFTER_TOMORROW_AT_TIME` - will open the day after tomorrow at `time`

`WILL_OPEN_AT_DAY_AT_TIME` - will open on `day` at `time`

`WILL_OPEN_IN_TIME` - will open in next `minutesTo`

###### Closed for break

`WILL_OPEN_IN_TIME_FROM_BREAK` - will open in `minutesTo` from brake `breakType`

`WILL_OPEN_AT_TIME_FROM_BREAK` - will open at `time` from brake `breakType`
