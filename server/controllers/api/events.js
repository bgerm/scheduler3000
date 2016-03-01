import Router from 'koa-router';
import moment from 'moment-timezone';
import Event from '../../models/event';

// converts from utc to timezone and back to utc
// TODO more efficient
const sameDayUTC = (utc, timezone) => {
  const { years, months, date } = moment.utc(utc).tz(timezone).toObject();
  return moment.utc([years, months, date]);
};

const jsonError = (message) => {
  return {
    error: {
      message: message
    }
  };
};

const eventsRouter = new Router({
  prefix: '/api/events'
});

eventsRouter
  .get('/', function* (next) {
    const { startDate, endDate, timezone } = this.request.query;

    if (!startDate || !endDate) {
      this.body = jsonError('startDate and endDate required');
      return;
    } else if (!timezone) {
      this.body = jsonError('timezone is required');
      return;
    }

    const allDayStart = sameDayUTC(moment.utc(startDate), timezone);
    const allDayEnd = sameDayUTC(moment.utc(endDate), timezone).endOf('day');

    const filter = {
      $or: [
        {
          allDay: false,
          startDate: { $lt: endDate },
          endDate: { $gt: startDate }
        },
        {
          allDay: true,
          startDate: { $lt: allDayEnd },
          endDate: { $gt: allDayStart }
        }
      ]
    };

    try {
      const events = yield Event.find(filter, '_id title startDate endDate allDay');
      this.body = {events: events.map((x) => x.toJSON({timezone}))};
    } catch (err) {
      this.body = jsonError(err.message);
    }
  })

  .post('/', function* (next) {
    try {
      const { timezone } = this.request.body;

      const event = new Event(this.request.body);
      event.startDate = sameDayUTC(moment.utc(event.startDate), timezone);
      event.endDate = sameDayUTC(moment.utc(event.endDate), timezone).endOf('day');

      const saved = yield event.save();

      this.body = {event: saved.toJSON({timezone})};
    } catch (err) {
      this.body = jsonError(err.message);
    }
  })

  .get('/:id', function* (next) {
    try {
      const { timezone } = this.request.query;

      const event = yield Event.findOne({_id: this.params.id});
      if (event) {
        this.body = {event: event.toJSON({timezone})};
      } else {
        this.body = jsonError('not found');
      }
    } catch (err) {
      this.body = jsonError(err.message);
    }
  })

  .put('/:id', function* (next) {
    const { timezone } = this.request.body;

    if (!timezone) {
      this.body = jsonError('timezone is required');
      return;
    }

    try {
      const event = yield Event.findOne({_id: this.params.id});

      if (!event) {
        this.body = jsonError('not found');
        return;
      }

      const allDay = this.request.body.allDay || event.allDay;

      for (let prop in this.request.body) {
        const value = this.request.body[prop];

        if (prop === 'startDate' && allDay) {
          event[prop] = sameDayUTC(moment.utc(value), timezone);
        } else if (prop === 'endDate' && allDay) {
          event[prop] = sameDayUTC(moment.utc(value), timezone).endOf('day');
        } else {
          event[prop] = value;
        }
      }

      const saved = yield event.save();

      this.body = saved.toJSON({timezone});
    } catch (err) {
      this.body = jsonError(err.message);
    }
  })

  .delete('/:id', function* (next) {
    try {
      yield Event.remove({_id: this.params.id});
      this.body = {id: this.params.id, success: true};
    } catch (err) {
      this.body = jsonError(err.message);
    }
  });

export default eventsRouter;
