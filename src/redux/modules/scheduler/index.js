import { combineReducers } from 'redux';
import {
  createModelReducer,
  createFormReducer
} from 'react-redux-form';
import drag from './drag';
import eventModal from './eventModal';
// import events from './events';
import events from './immutableEvents';
import period from './period';
import notification from './notification';
import allDayLayout from './allDayLayout';
import userSettings from './userSettings';

const initialNewEventState = {
  id: '',
  title: '',
  startDate: null,
  endDate: null,
  allDay: true
};

const scheduler = combineReducers({
  notification,
  drag,
  eventModal,
  events,
  period,
  allDayLayout,
  userSettings,
  newEvent: createModelReducer('scheduler.newEvent', initialNewEventState),
  newEventForm: createFormReducer('scheduler.newEvent')
});

export default scheduler;
