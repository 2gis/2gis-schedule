declare module '2gis-schedule' {

  export interface Hours {
    from: string;
    to: string;
  }

  export interface WorkingHours {
    'working_hours': Hours[]
  }

  export interface Schedule {
    'Mon'?: WorkingHours;
    'Tue'?: WorkingHours;
    'Wed'?: WorkingHours;
    'Thu'?: WorkingHours;
    'Fri'?: WorkingHours;
    'Sat'?: WorkingHours;
    'Sun'?: WorkingHours;
    'is24x7'?: boolean;
    comment?: string;
  }

  export type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

  export interface Now {
      day: Day,
      time: string;
  }

  export interface TodayWorktime {
    type: string;
    intervals: Hours[]
  }

  export interface ScheduleInfo {
      type: string;
      minutesTo?: number;
      time?: string;
      day?: Day;
      breakType?: string | null;
  }

  export function isOpened(schedule: Schedule, now: Now): boolean;
  export function is24x7(schedule: Schedule): boolean;
  export function isEveryDay(schedule: Schedule): boolean;

  export function getTodayWorktime(schedule: Schedule, now: Now): TodayWorktime;
  export function getTodayBreakHours(schedule: Schedule, now: Now): Hours[];
  export function getStatus(schedule: Schedule, now: Now, forecastThreshold: string, weekends: Day[]): ScheduleInfo | null;

  export const DAY_KEYS: string[];
}
