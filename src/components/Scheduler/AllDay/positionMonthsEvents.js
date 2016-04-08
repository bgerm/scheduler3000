import positionEvents from './positionEvents';
import { range, isRangeOverlapping } from 'utils/DateHelpers';

// Returns keys of events that overlap with the startDate and endDate
function findOverlaps(events, keys, startDate, endDate) {
  const overlaps = [];

  keys.forEach((k) => {
    const evnt = events.get(k);
    if (isRangeOverlapping(startDate, endDate,
      evnt.get('startDate'), evnt.get('endDate'))) {
      overlaps.push(k);
    }
  });

  return overlaps;
};

export default function positionMonthsEvents(eventsMap, period, showLimit) {
  const events = eventsMap.get('events');
  const keys = eventsMap.get('result');
  const startDate = period.get('startDate');
  const endDate = period.get('endDate');

  const weeks = range(startDate, endDate, 1, 'week');

  const positioned = weeks.reduce((positionedByWeek, weekStart) => {
    const weekEnd = weekStart.clone().add(6, 'days').endOf('day');
    const weekEventKeys = findOverlaps(events, keys, weekStart, weekEnd);

    positionedByWeek[weekStart.format('YYYYMMDD')] =
      showLimit === null
        ? []
        : positionEvents(
            weekEventKeys,
            events,
            weekStart,
            weekEnd.clone().endOf('day'),
            showLimit
          );

    return positionedByWeek;
  }, {});

  return positioned;
}
