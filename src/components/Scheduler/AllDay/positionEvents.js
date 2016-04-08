import { isRangeOverlapping } from 'utils/DateHelpers';
import { flatten, orderBy, last, findIndex } from 'lodash';
import moment from 'moment-timezone';

function overlaps(event1, event2) {
  if (!event1 || !event2) return false;

  return isRangeOverlapping(
    event1.get('startDate'),
    event1.get('endDate'),
    event2.get('startDate'),
    event2.get('endDate')
  );
}

function firstRowWithoutOverlaps(calendarEvent, rows) {
  return findIndex(rows, (row) => !overlaps(last(row), calendarEvent));
}

const positionedEvent = (eventKey, events, weekStartDate, weekEndDate) => {
  const evnt = events.get(eventKey);

  const eventStartDate = evnt.get('startDate');
  const eventEndDate = evnt.get('endDate');

  const adjStartDate = moment.max(eventStartDate, weekStartDate);
  const adjEndDate = moment.min(eventEndDate, weekEndDate);

  return {
    id: eventKey,
    span: adjEndDate.diff(adjStartDate, 'days') + 1,
    start: adjStartDate.diff(weekStartDate, 'days') + 1,
    startDate: adjStartDate,
    endDate: adjEndDate,
    moreLeft: eventStartDate < weekStartDate,
    moreRight: eventEndDate > weekEndDate
  };
};

function groupHiddenEventsByDay(hiddenRows, startDate, endDate) {
  const days = [];
  const flattenedRest = flatten(hiddenRows);
  let idx = 1;

  for (let dayStart = startDate;
       dayStart <= endDate;
       dayStart = dayStart.clone().add(1, 'days')) {
    const dayEnd = dayStart.clone().endOf('day');
    const overlapping = flattenedRest.filter((x) => {
      return isRangeOverlapping(
        x.startDate,
        x.endDate,
        dayStart,
        dayEnd
      );
    }).map((x) => x.id);

    days.push({
      id: overlapping,
      span: 1,
      start: idx,
      startDate: dayStart,
      endDate: dayEnd,
      moreLeft: false,
      moreRight: false
    });

    idx = idx + 1;
  }

  return days;
}

function createStopRowLookup(data, showCount) {
  return (data[showCount] || []).reduce((acc, val) => { acc[val.id] = val; return acc; }, {});
}

function createStopRowOverlapsLookup(data, showCount, hiddenDayEvents) {
  return (data[showCount] || []).reduce((acc, val) => {
    acc[val.id] = hiddenDayEvents.find((x) =>
      x.id.length > 1 && x.id.includes(val.id)) !== undefined;
    return acc;
  }, {});
}

// TODO improve / optimize / make not shit
function collapse(data, showCount, startDate, endDate) {
  const visibleRows = data.slice(0, showCount);
  const hiddenRows = data.slice(showCount);

  const hiddenDayEvents = groupHiddenEventsByDay(hiddenRows, startDate, endDate);

  const stopRowLookup = createStopRowLookup(data, showCount);
  const stopRowOverlapLookup = createStopRowOverlapsLookup(data, showCount, hiddenDayEvents);

  // filter to select days that have an id of length 1 and
  //   that have a stop row with overlaps or a stop row with a position start
  //   that is equal to the day it's on
  // map to convert rows that have an id of length 1
  //   to the firt element in that id list if
  //   the position start is equal to the day it's on
  //   and it's a stop row without overlaps
  const moreRow = hiddenDayEvents.filter((hiddenDayEvent) => {
    if (hiddenDayEvent.id.length === 0) { return false; };
    if (hiddenDayEvent.id.length !== 1) { return true; };

    const id = hiddenDayEvent.id[0];
    const positionedEvent = stopRowLookup[id];

    return stopRowOverlapLookup[id] ||
      !positionedEvent ||
      positionedEvent.start === hiddenDayEvent.start;
  }).map((hiddenDayEvent) => {
    if (hiddenDayEvent.id.length !== 1) { return hiddenDayEvent; };

    const positionedEvent = stopRowLookup[hiddenDayEvent.id[0]];

    return positionedEvent &&
      hiddenDayEvent.start === positionedEvent.start &&
      !stopRowOverlapLookup[hiddenDayEvent.id[0]]
      ? stopRowLookup[hiddenDayEvent.id[0]]
      : hiddenDayEvent;
  });

  return moreRow.length > 0 ? visibleRows.concat([moreRow]) : visibleRows;
}

// returns an array of arrays of
// {eventId, position: { start, span, moreLeft, moreRight} }
export default function positionEvents(weekEventKeys, events, startDate, endDate, showLimit) {
  if (!weekEventKeys) {
    return [];
  }

  const sortedEvents = orderBy(weekEventKeys,
    [(x) => moment.max(events.getIn([x, 'startDate']), startDate).valueOf(),
     (x) => moment.min(events.getIn([x, 'endDate']), endDate).valueOf()],
    ['asc', 'desc']
  );

  const rows = [];

  sortedEvents.forEach((eventIdx, index) => {
    const ev = events.get(eventIdx);

    const firstIdx = firstRowWithoutOverlaps(ev, rows);
    if (firstIdx === -1) {
      rows.push([ev]); // add a new row
    } else {
      rows[firstIdx].push(ev); // append at the found row
    }
  });

  // convert to new the positioned format
  const result = rows.map((row) =>
    row.map((evnt) => positionedEvent(evnt.get('id'), events, startDate, endDate))
  );

  // collapse if we have a show limit
  if (showLimit >= 0) {
    return collapse(result, showLimit, startDate, endDate);
  } else {
    return result;
  }
}
