import Immutable from 'immutable';
import moment from 'moment-timezone';

// ------------------------------------
// Action Types
// ------------------------------------
const SET_START_DATE = 'scheduler/period/SET_START_DATE';
const NEXT_PERIOD = 'scheduler/period/NEXT_PERIOD';
const PREVIOUS_PERIOD = 'scheduler/period/PREVIOUS_PERIOD';
const CHANGE_PERIOD = 'scheduler/period/CHANGE_PERIOD';
const CHANGE_TIMEZONE = 'scheduler/period/CHANGE_TIMEZONE';
const SET_TODAY = 'scheduler/period/SET_TODAY';

export const PERIOD_TYPES = {
  monthly: 'monthly',
  weekly: 'weekly',
  daily: 'daily'
};

// ------------------------------------
// Helpers
// ------------------------------------

// returns the start and end date for the period
function periodBounds(period, date) {
  let startDate = date.clone();
  let endDate = date.clone();

  if (period === PERIOD_TYPES.monthly) {
    startDate = date.clone().startOf('month').startOf('week');
    endDate = startDate.clone().add(5, 'weeks').endOf('week');
  } else if (period === PERIOD_TYPES.weekly) {
    startDate = date.clone().startOf('week');
    endDate = startDate.clone().endOf('week');
  }

  return {
    startDate: startDate.startOf('day'),
    endDate: endDate.endOf('day')
  };
}

function findNextPeriod(period, date) {
  if (period === PERIOD_TYPES.monthly) {
    return date.clone().add(1, 'month');
  } else if (period === PERIOD_TYPES.weekly) {
    return date.clone().add(7, 'days');
  }

  return date;
}

function findPreviousPeriod(period, date) {
  if (period === PERIOD_TYPES.monthly) {
    return date.clone().add(-1, 'month');
  } else if (period === PERIOD_TYPES.weekly) {
    return date.clone().add(-7, 'days');
  }

  return date;
}

// ------------------------------------
// Reducer
// ------------------------------------

// TODO grab these from server??
const timezone = 'America/New_York';
const today = moment.tz(timezone);

const initialSelectedDate = today.clone().startOf('month');
const initialPeriodType = PERIOD_TYPES.monthly;
const initalBounds = periodBounds(initialPeriodType, initialSelectedDate);

export const initialState = Immutable.Map({
  periodType: initialPeriodType,
  today: today,
  selectedDate: initialSelectedDate,
  startDate: initalBounds.startDate,
  endDate: initalBounds.endDate,
  timezone: timezone
});

// Reducer
export default function startDate(state = initialState, action) {
  switch (action.type) {
    case SET_START_DATE:
      return state.merge({
        ...periodBounds(state.get('period'), action.date),
        period: action.period,
        selectedDate: action.date
      });

    case NEXT_PERIOD:
      const nextDate =
        findNextPeriod(state.get('period'), state.get('selectedDate'));

      return state.merge({
        selectedDate: nextDate,
        ...periodBounds(state.get('period'), nextDate)
      });

    case PREVIOUS_PERIOD:
      const previousDate =
        findPreviousPeriod(state.get('period'), state.get('selectedDate'));

      return state.merge({
        selectedDate: previousDate,
        ...periodBounds(state.get('period'), previousDate)
      });

    case CHANGE_PERIOD:
      return state.merge({
        period: action.period,
        ...periodBounds(action.period, state.get('selectedDate'))
      });

    case SET_TODAY:
      return state.set('today', action.today);

    case CHANGE_TIMEZONE:
      return state.set('timezone', action.timezone);

    default:
      return state;
  }
}

// ------------------------------------
// Action Creators
// ------------------------------------
const getRoutePeriod = (state) => {
  const path = state.router.locationBeforeTransitions.pathname;

  let period = null;
  if (path.indexOf('/scheduler') >= 0) {
    period = path.split('/')[2];
  }

  return period;
};

export function setToday() {
  return {
    type: SET_TODAY,
    today: moment.tz(timezone)
  };
}

export function toToday() {
  return (dispatch, getState) => {
    const state = getState();
    const t = state.scheduler.period.get('today');
    dispatch(setStartDate(t));
  };
}

export function changePeriod(period) {
  return {
    type: CHANGE_PERIOD,
    period: period
  };
}

export function changeTimezone(timezone) {
  return {
    type: CHANGE_TIMEZONE,
    timezone: timezone
  };
}

export function setStartDate(date) {
  return (dispatch, getState) => {
    const period = getRoutePeriod(getState());

    dispatch({
      type: SET_START_DATE,
      date: date,
      period: period
    });
  };
}

export function nextPeriod() {
  return (dispatch, getState) => {
    const period = getRoutePeriod(getState());

    dispatch({
      type: NEXT_PERIOD,
      period: period
    });
  };
}

export function previousPeriod() {
  return (dispatch, getState) => {
    const period = getRoutePeriod(getState());

    dispatch({
      type: PREVIOUS_PERIOD,
      period: period
    });
  };
}
