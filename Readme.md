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

# getBreakHours

Returns array of breaks between work time intervals
If work time is: `[{ from: '08:00', to: '13:00' }, { from: '14:00', to: '17:45' }, { from: '18:00', to: '20:00' }]`
Breaks will be `[{ from: '13:00', to: '14:00' }, { from: '17:45', to: '18:00' }]`

#### Arguments
* `schedule` - 2gis schedule object
* `now` - now time moment

#### Returns
`Array` - array of organisation breaks for today
