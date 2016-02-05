import express from 'express';
import Event from '../../models/event';
import { reduce, mapKeys } from 'lodash';
import moment from 'moment-timezone';

const router = express.Router();

// converts from utc to timezone and back to utc
// TODO more efficient
const sameDayUTC = (utc, timezone) => {
  const { years, months, date } = moment.utc(utc).tz(timezone).toObject();
  return moment.utc([years, months, date]);
}

const jsonError = (message) => {
  return {
    error: {
      message: message
    } 
  };
}

router.route('/events')
  .get((req, res) => {
    const { startDate, endDate, timezone } = req.query;

    if (!startDate || !endDate) {
      res.json(jsonError('startDate and endDate required'))
      return;
    } else if (!timezone) {
      res.json(jsonError('timezone is required'))
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

    Event.find(filter, '_id title startDate endDate allDay')
      .then(result => {
        res.json({events: result.map(x => x.toJSON({timezone}))})
      })
      .catch(err =>
        res.json(jsonError(err.message))
      );
  })

  .post((req, res) => {
    const event = new Event(req.body);
    event.save()
      .then(result =>
        res.json({event: event.toJSON()})
      )
      .catch(err =>
        res.json(jsonError(err.message))
      );
  });

router.route('/events/:id')
  .get((req, res) => {
    Event.findOne({_id: req.params.id})
      .then(result => {
        if (result) {
          res.json({event: result.toJSON()});
        } else {
          res.json(jsonError('not found'));
        }
      })
      .catch(err =>
        res.json(jsonError(err.message))
      );
  })

  .put((req, res) => {
    const { timezone } = req.body;

    if (!timezone) {
      res.json(jsonError('timezone is required'))
      return;
    }

    Event.findOne({_id: req.params.id})
      .then(event => {
        const allDay = req.body.allDay || event.allDay;

        for (let prop in req.body) {
          const value = req.body[prop];

          if (prop === 'startDate' && allDay) {
            event[prop] = sameDayUTC(moment.utc(value), timezone);
          } else if (prop === 'endDate' && allDay) {
            event[prop] = sameDayUTC(moment.utc(value), timezone).endOf('day');
          } else {
            event[prop] = value;
          }
        }

        event.save()
          .then(result =>
            res.json(result.toJSON({timezone}))
          )
          .catch(err => {
            res.json(jsonError(err.message))
          });
        }
      )
      .catch(err => {
        res.json(jsonError(err.message))
      });
  })

  .delete((req, res) => {
    Event.remove({_id: req.params.id})
      .then(result =>
        res.json({id: req.params.id, success: true})
      )
      .catch(err =>
        res.json(jsonError(err.message))
      );
  });

export default router;
