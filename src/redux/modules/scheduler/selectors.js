import Immutable from 'immutable';
import themes from 'components/Scheduler/themes';
import positionMonthsEvents from 'components/Scheduler/AllDay/positionMonthsEvents';
import { defaultMemoize, createSelector, createSelectorCreator } from 'reselect';

export function eventsSelector(state) {
  return state.scheduler.events;
}

export function periodSelector(state) {
  return state.scheduler.period;
}

export function userSettingsSelector(state) {
  return state.scheduler.userSettings;
}

export function allDayLayoutSelector(state) {
  return state.scheduler.allDayLayout;
}

// Position Events Selector
// That works by listening for new events, period, all day layout, and user
// setting selector changes.  Then it positions the events based on those
// selectors and returns that value.
const createEventSelector = createSelectorCreator(
  defaultMemoize,
  (a, b) => a.get('events') === b.get('events') && a.get('result') === b.get('result')
);

export const justEventsSelector = createEventSelector(
  (state) => eventsSelector(state),
  (events) => events
);

function determineShowLimit(userSettings, allDayLayout, rowCount = 0, isDaysLabelPresent) {
  const theme = themes[userSettings.get('theme', 'default')].allDay;

  const grid = allDayLayout.get('grid');
  const borders = rowCount;

  if (rowCount === 0 || !grid) return 0;

  const totalEventMargin = theme.eventRow.marginTop + theme.eventRow.marginBottom;
  const cellHeight = ((grid.get('height') - borders) / rowCount);
  const show = Math.floor(cellHeight / (theme.eventRow.height + totalEventMargin));

  return Math.max(0, isDaysLabelPresent ? show - 2 : show - 1);
}

export const positionEventsSelector = (useShowLimit) => createSelector(
  justEventsSelector,
  periodSelector,
  allDayLayoutSelector,
  userSettingsSelector,
  (events, period, allDayLayout, userSettings) => {
    const weeks = period.get('endDate').diff(period.get('startDate'), 'weeks') + 1;
    const showLimit = useShowLimit
      ? determineShowLimit(userSettings, allDayLayout, weeks, true)
      : -1;
    return Immutable.fromJS(positionMonthsEvents(events, period, showLimit));
  }
);
