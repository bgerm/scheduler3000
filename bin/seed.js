require('dotenv').load();

import Event from '../server/models/event';
import mongoose from 'mongoose';
import moment from 'moment-timezone';
import faker from 'faker';

// TODO: seed via REST API instad?

mongoose.Promise = Promise;

const { MONGO_DB, MONGO_URL } = process.env;
const connStr = `${MONGO_URL}/${MONGO_DB}`;

try {
  mongoose.connect(connStr);
} catch (err) {
  console.log('error connecting to mongodb', err);
}

function seedNewEvents() {
  const beginning = moment.utc().startOf('month').startOf('week');

  const addDays = (date, addDays) => date.clone().add(addDays, 'days');

  const data = (startDays, endDays) => {
    return {
      title: `${faker.lorem.words(1)} ${faker.random.number(10)}`,
      startDate: addDays(beginning, startDays - 1),
      endDate: addDays(beginning, endDays - 1).endOf('day'),
      allDay: true
    };
  };

  const newEvents = [
    data(1, 6),
    data(1, 3),
    data(1, 3),
    data(1, 5),
    data(1, 5),
    data(7, 7),
    data(7, 7),
    data(7, 7),
    data(8, 10),
    data(11, 16),
    data(16, 18)
  ];

  const saved = newEvents.map((doc) => {
    return Event.create(doc)
      .then((x) => console.log('saved', x.title))
      .catch((err) => console.log('error', err, doc));
  });

  return Promise.all(saved);
}

async function seed() {
  try {
    await seedNewEvents();
  } catch (err) {
    console.log('error:', err);
  }

  mongoose.disconnect();
  return true;
}

seed();
