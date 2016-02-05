import { combineReducers } from 'redux';
import {
  createModelReducer,
  createFormReducer
} from 'react-redux-form';
import drag from './drag';
import eventModal from './eventModal';
import events from './events';
import period from './period';
import notification from './notification';

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
  newEvent: createModelReducer('scheduler.newEvent', initialNewEventState),
  newEventForm: createFormReducer('scheduler.newEvent')
});

export default scheduler;
