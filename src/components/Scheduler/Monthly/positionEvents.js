import { isRangeOverlapping } from 'utils/DateHelpers';
import { flatten, orderBy, last, findIndex } from 'lodash';
import moment from 'moment-timezone';

function overlaps(event1, event2) {
  if (!event1 || !event2) return false;

  return isRangeOverlapping(
    event1.startDate,
    event1.endDate,
    event2.startDate,
    event2.endDate
  );
}

function firstRowWithoutOverlaps(event, rows) {
  return findIndex(rows, row => !overlaps(last(row), event));
}

const positionedEvent = (eventKey, events, weekStartDate, weekEndDate) => {
  const evnt = events.events[eventKey];

  const adjStartDate = moment.max(evnt.startDate, weekStartDate);
  const adjEndDate = moment.min(evnt.endDate, weekEndDate);

  return {
    id: eventKey,
    span: adjEndDate.diff(adjStartDate, 'days') + 1,
    start: adjStartDate.diff(weekStartDate, 'days') + 1,
    startDate: adjStartDate,
    endDate: adjEndDate,
    moreLeft: evnt.startDate < weekStartDate,
    moreRight: evnt.endDate > weekEndDate
  };
};

// TODO improve / optimize / make not shit
function collapse(data, showCount, startDate, endDate) {
  const show = data.slice(0, showCount);
  const rest = data.slice(showCount);

  const days = [];
  const flattenedRest = flatten(rest);
  let idx = 1;

  for (let d = startDate; d <= endDate; d = d.clone().add(1, 'days')) {
    const end = d.clone().endOf('day');
    const overlapping = flattenedRest.filter(x => {
      return overlaps(x, {startDate: d, endDate: end});
    }).map(x => x.id);

    days.push({
      id: overlapping,
      span: 1,
      start: idx,
      startDate: d,
      endDate: end,
      moreLeft: false,
      moreRight: false
    });

    idx = idx + 1;
  }

  const stopRow = (data[showCount] || []).reduce((acc, val) => { acc[val.id] = val; return acc; }, {});

  const stopRowWithOverlaps = (data[showCount] || []).reduce((acc, val) => {
    acc[val.id] = days.find(x => x.id.length > 1 && x.id.includes(val.id)) !== undefined;
    return acc;
  }, {});

  // filter to select days that have an id of length 1 and
  //   that have a stop row with overlaps or a stop row with a position start
  //   that is equal to the day it's on
  // map to convert rows that have an id of length 1
  //   to the firt element in that id list if
  //   the position start is equal to the day it's on
  //   and it's a stop row without overlaps
  const moreRow = days.filter(x => {
    if (x.id.length === 0) { return false; };
    if (x.id.length !== 1) { return true; };

    const id = x.id[0];
    const pos = stopRow[id];
    return stopRowWithOverlaps[id] || pos && x.start === pos.start || !pos;
  }).map(x => {
    if (x.id.length !== 1) { return x; };

    const pos = stopRow[x.id[0]];

    return pos && x.start === pos.start && !stopRowWithOverlaps[x.id[0]]
      ? stopRow[x.id[0]]
      : x;
  });

  return moreRow.length > 0 ? show.concat([moreRow]) : show;
}

// returns an array of arrays of {eventId, position: { start, span, moreLeft,
// moreRight}
export default function positionEvents(weekEvents, events, startDate, endDate, showCount) {
  if (!weekEvents) {
    return [];
  }

  const sortedEvents = orderBy(weekEvents,
    [x => moment.max(events.events[x].startDate, startDate).valueOf(),
     x => moment.min(events.events[x].endDate, endDate).valueOf()],
    ['asc', 'desc']
  );

  const rows = [];

  sortedEvents.forEach((eventIdx, index) => {
    const ev = events.events[eventIdx];

    const firstIdx = firstRowWithoutOverlaps(ev, rows);
    if (firstIdx === -1) {
      rows.push([ev]);
    } else {
      rows[firstIdx].push(ev);
    }
  });

  const result = rows.map(x => x.map(y => positionedEvent(y.id, events, startDate, endDate)));
  if (showCount) {
    return collapse(result, showCount, startDate, endDate);
  } else {
    return result;
  }
}
