import { cancel, SagaCancellationException, call, take, put, fork } from 'redux-saga';
import * as EventsActions from 'redux/modules/scheduler/events';
import positionMonthsEvents from 'components/Scheduler/Monthly/positionMonthsEvents';
import { insertEvent, updateEvent, deleteEvent } from 'services/api';
import * as NotificationActions from 'redux/modules/scheduler/notification';
import delay from 'utils/delay';

import {
  changePeriod // , setToday
} from 'redux/modules/scheduler/period';

import { UPDATE_PATH } from 'redux-simple-router';
const INIT_PATH = '@@router/INIT_PATH';

function* setStartDateOnPathChange() {
  while (true) {
    const routeChange = yield take([UPDATE_PATH, INIT_PATH]);

    const path = routeChange.payload.path;

    if (path.indexOf('/scheduler') >= 0) {
      const period = path.split('/')[2];
      yield put(changePeriod(period));
    }
  }
}

function* updateToday() {
  /*
  while (true) {
    yield delay(1000 * 60);
    yield put(setToday());
  }
  */
}

function* insertEventInBackend(getState) {
  const { INSERT_EVENT } = EventsActions.actionTypes;
  while (true) {
    const action = yield take(INSERT_EVENT);
    const timezone = getState().scheduler.period.get('timezone');
    const result = yield call(insertEvent, action.evnt, timezone);
    if (result.error) {
      yield put(EventsActions.insertEventFailure(result.error, action.evnt.id));
      yield put(NotificationActions.setNotification(`Error adding ${action.evnt.title}`));
    } else if (result.response) {
      yield put(EventsActions.insertEventSuccess(result.response.event, action.evnt.id));
      yield put(NotificationActions.setNotification(`Added event: ${action.evnt.title}`));
    }
  }
}

function* updateEventInBackend(getState) {
  const { UPDATE_EVENT } = EventsActions.actionTypes;
  while (true) {
    const action = yield take(UPDATE_EVENT);
    const timezone = getState().scheduler.period.get('timezone');
    const title = getState().scheduler.events.events[action.evnt.id].title;
    const result = yield call(updateEvent, action.evnt, timezone);
    if (result.error) {
      yield put(EventsActions.updateEventFailure(result.error));
      yield put(NotificationActions.setNotification(`Error updating ${title}`));
    } else if (result.response) {
      yield put(EventsActions.updateEventSuccess(result.response));
      yield put(NotificationActions.setNotification(`Updated event: ${title}`));
    }
  }
}

function* deleteEventInBackend(getState) {
  const { DELETE_EVENT } = EventsActions.actionTypes;
  while (true) {
    const action = yield take(DELETE_EVENT);
    const result = yield call(deleteEvent, action.id);
    if (result.error) {
      yield put(EventsActions.deleteEventFailure(result.error));
      yield put(NotificationActions.setNotification('Error deleting your event'));
    } else if (result.response) {
      yield put(EventsActions.deleteEventSuccess(result.response.id));
      yield put(NotificationActions.setNotification('Your event has been deleted'));
    }
  }
}

function* positionEvents(getState) {
  const positioned = yield call(positionMonthsEvents, getState().scheduler);
  yield put(EventsActions.updatePositioned(positioned));
}

function* watchPositionEvents(getState) {
  const {
    LOAD_EVENTS_SUCCESS,
    DELETE_EVENT,
    INSERT_EVENT,
    UPDATE_EVENT,
    UPDATE_SHOW_LIMIT,
    INSERT_EVENT_SUCCESS,
    UPDATE_EVENT_SUCCESS,
    DELETE_EVENT_SUCCESS
  } = EventsActions.actionTypes;

  while (yield take([
    LOAD_EVENTS_SUCCESS,
    INSERT_EVENT,
    UPDATE_EVENT,
    DELETE_EVENT,
    UPDATE_SHOW_LIMIT,
    INSERT_EVENT_SUCCESS,
    UPDATE_EVENT_SUCCESS,
    DELETE_EVENT_SUCCESS]
  )) {
    yield fork(positionEvents, getState);
  }
}

function* cancelNotification() {
  try {
    yield call(delay, 3000);
    yield put(NotificationActions.clearNotification());
  } catch (error) {
    if (error instanceof SagaCancellationException) {
      // console.log('sync canceled');
    } else {
      // console.log('error', erorr);
    }
  }
}

function* hideNotification() {
  let clearTimer;

  const { SET_NOTIFICATION, CLEAR_NOTIFICATION } = NotificationActions.actionTypes;

  while (true) {
    const action = yield take([SET_NOTIFICATION, CLEAR_NOTIFICATION]);
    if (clearTimer) {
      yield cancel(clearTimer);
      clearTimer = null;
    }

    if (action.type === SET_NOTIFICATION) {
      clearTimer = yield fork(cancelNotification);
    }
  }
}

export default function* root(getState) {
  yield fork(setStartDateOnPathChange);
  yield fork(updateToday);
  yield fork(watchPositionEvents, getState);
  yield fork(updateEventInBackend, getState);
  yield fork(deleteEventInBackend, getState);
  yield fork(insertEventInBackend, getState);
  yield fork(hideNotification);
}
