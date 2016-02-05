import moment from 'moment-timezone';
import positionEvents from '../../src/components/Scheduler/Monthly/positionEvents';
import { pick } from 'lodash';

describe('positionEvents', function () {
  it('Should position events in their right place', function () {
    const normalizedEvents = {
      events: {
        1: {
          id: 1,
          title: 'event1',
          startDate: moment.tz('2016-01-04 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-06 23:59:59', 'UTC'),
          allDay: true
        },
        2: {
          id: 2,
          title: 'event2',
          startDate: moment.tz('2016-01-01 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-07 23:59:59', 'UTC'),
          allDay: true
        },
        3: {
          id: 3,
          title: 'event3',
          startDate: moment.tz('2016-01-01 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-04 23:59:59', 'UTC'),
          allDay: true
        },
        4: {
          id: 4,
          title: 'event4',
          startDate: moment.tz('2016-01-01 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-02 23:59:59', 'UTC'),
          allDay: true
        },
        5: {
          id: 5,
          title: 'event5',
          startDate: moment.tz('2016-01-07 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-07 23:59:59', 'UTC'),
          allDay: true
        },
        6: {
          id: 6,
          title: 'event6',
          startDate: moment.tz('2016-01-01 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-02 23:59:59', 'UTC'),
          allDay: true
        }
      },
      weekEvents: [1, 2, 3, 4, 5, 6]
    };

    const { weekEvents } = normalizedEvents;

    const startDate = moment.tz('2016-01-01 00:00:00', 'UTC');
    const endDate = moment.tz('2016-01-07 23:59:59', 'UTC');

    const positioned = positionEvents(weekEvents, normalizedEvents, startDate, endDate);

    const expected = [[2], [3, 5], [4, 1], [6]];
    const got = positioned.map(x => x.map(y => y.id));

    expect(got).to.deep.equal(expected);
  });

  it('Should collapse collapse events with more event (test 1)', function () {
    const normalizedEvents = {
      events: {
        1: {
          id: 1,
          title: 'event1',
          startDate: moment.tz('2016-01-03 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-05 23:59:59', 'UTC'),
          allDay: true
        },
        2: {
          id: 2,
          title: 'event2',
          startDate: moment.tz('2016-01-01 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-07 23:59:59', 'UTC'),
          allDay: true
        },
        3: {
          id: 3,
          title: 'event3',
          startDate: moment.tz('2015-12-20 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-02 23:59:59', 'UTC'),
          allDay: true
        },
        4: {
          id: 4,
          title: 'event4',
          startDate: moment.tz('2016-01-03 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-04 23:59:59', 'UTC'),
          allDay: true
        },
        5: {
          id: 5,
          title: 'event5',
          startDate: moment.tz('2016-01-06 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-12 23:59:59', 'UTC'),
          allDay: true
        }
      },
      weekEvents: [1, 2, 3, 4, 5]
    };

    const { weekEvents } = normalizedEvents;

    const startDate = moment.tz('2016-01-01 00:00:00', 'UTC');
    const endDate = moment.tz('2016-01-07 23:59:59', 'UTC');

    const positioned = positionEvents(weekEvents, normalizedEvents, startDate, endDate, 1);

    const expected = [
      [{id: 2, start: 1, span: 7, moreLeft: false, moreRight: false}],
      [
        {id: 3, start: 1, span: 2, moreLeft: true, moreRight: false},
        {id: [1, 4], start: 3, span: 1, moreLeft: false, moreRight: false},
        {id: [1, 4], start: 4, span: 1, moreLeft: false, moreRight: false},
        {id: [1], start: 5, span: 1, moreLeft: false, moreRight: false},
        {id: 5, start: 6, span: 2, moreLeft: false, moreRight: true}
      ]
    ];

    const got = positioned.map(x => x.map(y => pick(y, ['id', 'start', 'span', 'moreLeft', 'moreRight'])));

    expect(got).to.deep.equal(expected);
  });

  it('Should collapse collapse events with more event (test 2)', function () {
    const normalizedEvents = {
      events: {
        1: {
          id: 1,
          title: 'event1',
          startDate: moment.tz('2015-12-27 00:00:00', 'UTC'),
          endDate: moment.tz('2015-12-31 23:59:59', 'UTC'),
          allDay: true
        },
        2: {
          id: 2,
          title: 'event2',
          startDate: moment.tz('2015-12-27 00:00:00', 'UTC'),
          endDate: moment.tz('2015-12-31 23:59:59', 'UTC'),
          allDay: true
        },
        3: {
          id: 3,
          title: 'event3',
          startDate: moment.tz('2015-12-27 00:00:00', 'UTC'),
          endDate: moment.tz('2015-12-29 23:59:59', 'UTC'),
          allDay: true
        },
        4: {
          id: 4,
          title: 'event4',
          startDate: moment.tz('2015-12-27 00:00:00', 'UTC'),
          endDate: moment.tz('2015-12-29 23:59:59', 'UTC'),
          allDay: true
        },
        5: {
          id: 5,
          title: 'event5',
          startDate: moment.tz('2015-12-30 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-04 23:59:59', 'UTC'),
          allDay: true
        },
        6: {
          id: 6,
          title: 'event6',
          startDate: moment.tz('2016-01-02 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-02 23:59:59', 'UTC'),
          allDay: true
        },
        7: {
          id: 7,
          title: 'event7',
          startDate: moment.tz('2016-01-02 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-02 23:59:59', 'UTC'),
          allDay: true
        },
        8: {
          id: 8,
          title: 'event8',
          startDate: moment.tz('2016-01-02 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-02 23:59:59', 'UTC'),
          allDay: true
        }
      },
      weekEvents: [1, 2, 3, 4, 5, 6, 7, 8]
    };

    const { weekEvents } = normalizedEvents;

    const startDate = moment.tz('2015-12-27 00:00:00', 'UTC');
    const endDate = moment.tz('2016-01-02 23:59:59', 'UTC');

    const positioned = positionEvents(weekEvents, normalizedEvents, startDate, endDate, 2);

    const expected = [
      [{id: 1, start: 1, span: 5, moreLeft: false, moreRight: false}, {id: 6, start: 7, span: 1, moreLeft: false, moreRight: false}],
      [{id: 2, start: 1, span: 5, moreLeft: false, moreRight: false}, {id: 7, start: 7, span: 1, moreLeft: false, moreRight: false}],
      [
        {id: [3, 4], start: 1, span: 1, moreLeft: false, moreRight: false},
        {id: [3, 4], start: 2, span: 1, moreLeft: false, moreRight: false},
        {id: [3, 4], start: 3, span: 1, moreLeft: false, moreRight: false},
        {id: [5], start: 4, span: 1, moreLeft: false, moreRight: false},
        {id: [5], start: 5, span: 1, moreLeft: false, moreRight: false},
        {id: [5], start: 6, span: 1, moreLeft: false, moreRight: false},
        {id: [5, 8], start: 7, span: 1, moreLeft: false, moreRight: false}
      ]
    ];

    const got = positioned.map(x => x.map(y => pick(y, ['id', 'start', 'span', 'moreLeft', 'moreRight'])));

    expect(got).to.deep.equal(expected);
  });

  it('Should collapse collapse events with more event (test 3)', function () {
    const normalizedEvents = {
      events: {
        1: {
          id: 1,
          title: 'event1',
          startDate: moment.tz('2015-12-27 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-01 23:59:59', 'UTC'),
          allDay: true
        },
        2: {
          id: 2,
          title: 'event2',
          startDate: moment.tz('2015-12-27 00:00:00', 'UTC'),
          endDate: moment.tz('2015-12-27 23:59:59', 'UTC'),
          allDay: true
        },
        3: {
          id: 3,
          title: 'event3',
          startDate: moment.tz('2015-12-29 00:00:00', 'UTC'),
          endDate: moment.tz('2015-12-31 23:59:59', 'UTC'),
          allDay: true
        },
        4: {
          id: 4,
          title: 'event4',
          startDate: moment.tz('2016-01-02 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-02 23:59:59', 'UTC'),
          allDay: true
        },
        5: {
          id: 5,
          title: 'event5',
          startDate: moment.tz('2016-01-02 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-02 23:59:59', 'UTC'),
          allDay: true
        },
        6: {
          id: 6,
          title: 'event6',
          startDate: moment.tz('2015-12-30 00:00:00', 'UTC'),
          endDate: moment.tz('2016-01-01 23:59:59', 'UTC'),
          allDay: true
        }
      },
      weekEvents: [1, 2, 3, 4, 5, 6]
    };

    const { weekEvents } = normalizedEvents;

    const startDate = moment.tz('2015-12-27 00:00:00', 'UTC');
    const endDate = moment.tz('2016-01-02 23:59:59', 'UTC');

    const positioned = positionEvents(weekEvents, normalizedEvents, startDate, endDate, 1);

    const expected = [
      [{id: 1, start: 1, span: 6, moreLeft: false, moreRight: false}, {id: 4, start: 7, span: 1, moreLeft: false, moreRight: false}],
      [
        {id: 2, start: 1, span: 1, moreLeft: false, moreRight: false},
        {id: [3], start: 3, span: 1, moreLeft: false, moreRight: false},
        {id: [3, 6], start: 4, span: 1, moreLeft: false, moreRight: false},
        {id: [3, 6], start: 5, span: 1, moreLeft: false, moreRight: false},
        {id: [6], start: 6, span: 1, moreLeft: false, moreRight: false},
        {id: 5, start: 7, span: 1, moreLeft: false, moreRight: false}
      ]
    ];

    const got = positioned.map(x => x.map(y => pick(y, ['id', 'start', 'span', 'moreLeft', 'moreRight'])));

    expect(got).to.deep.equal(expected);
  });
});
