import positionEvents from './positionEvents';
import { range, isRangeOverlapping } from 'utils/DateHelpers';

function findOverlaps(events, keys, startDate, endDate) {
  const overlaps = [];

  keys.forEach(k => {
    const evnt = events[k];
    if (isRangeOverlapping(startDate, endDate, evnt.startDate, evnt.endDate)) {
      overlaps.push(k);
    }
  });

  return overlaps;
};

export default function positionMonthsEvents(scheduler) {
  const events = scheduler.events;
  const keys = scheduler.events.result;
  const startDate = scheduler.period.get('startDate');
  const endDate = scheduler.period.get('endDate');
  const showLimit = scheduler.events.showLimit;

  const weeks = range(startDate, endDate, 1, 'week');

  performance.mark('position-start');

  const positioned = weeks.reduce((result, weekStart) => {
    const weekEnd = weekStart.clone().add(6, 'days').endOf('day');
    const weekEvents = findOverlaps(events.events, keys, weekStart, weekEnd); // TODO change to just events

    result[weekStart.format('YYYYMMDD')] =
      showLimit === null
        ? []
        : positionEvents(
            weekEvents,
            events,
            weekStart,
            weekEnd.clone().endOf('day'),
            showLimit
          );

    return result;
  }, {});

  performance.mark('position-end');
  performance.measure('position events', 'position-start', 'position-end');

  return positioned;
}
