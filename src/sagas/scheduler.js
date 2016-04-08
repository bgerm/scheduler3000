import { Observable } from 'rxjs';
import { changePeriod } from 'redux/modules/scheduler/period';
import { fetchEvents, insertEvent, updateEvent, deleteEvent } from 'services/api';
import * as EventsActions from 'redux/modules/scheduler/events';
import * as NotificationActions from 'redux/modules/scheduler/notification';
import * as PeriodActions from 'redux/modules/scheduler/period';
import 'utils/rxjs/add/takeWhileInclusive';
import actionPredicate from './utils/actionPredicate';
import allDayDnd from './allDayDnd';

// -------------
// Change Period
// -------------

const ROUTER_CHANGE = '@@router/LOCATION_CHANGE';

const changePeriodOnPathChange = (iterable) => iterable
  .filter(actionPredicate([ROUTER_CHANGE]))
  .map((value) => value.action)
  .map((routeChange) => routeChange.payload.pathname)
  .filter((path) => path.indexOf('/scheduler') >= 0)
  .map((path) => path.split('/')[2])
  .filter((period) => period)
  .map((period) => changePeriod(period));

// ---------------------------
// Fetch data on period change
// ---------------------------

const fetchData = (iterable) => {
  const dataChangedStream = iterable
    .filter(actionPredicate(Object.values(PeriodActions.actionTypes)))
    .map(({action, store}) => store.scheduler.period)
    .distinctUntilChanged()
    .debounceTime(250);

  const fetchStream = dataChangedStream.flatMap((period) => {
    const startDate = period.get('startDate');
    const endDate = period.get('endDate');
    const timezone = period.get('timezone');

    return Observable
      .fromPromise(fetchEvents({startDate, endDate, timezone}))
      .map((data) => {
        const { response, error } = data;
        if (response) {
          const events = response.entities.events;
          const result = response.result.events;

          return EventsActions.loadEventsSuccess(events, result);
        } else {
          return EventsActions.loadEventsFailure(error);
        }
      });
  });

  const isLoadingStream = dataChangedStream
    .map((x) => true)
    .merge(fetchStream.map((x) => false))
    .distinctUntilChanged()
    .filter((x) => x)
    .map((x) => EventsActions.pushFetching());

  return fetchStream.merge(isLoadingStream);
};

// ------------------------
// Modify Events In Backend
// ------------------------

const insertEventInBackend = (iterable) => iterable
  .filter(actionPredicate([EventsActions.actionTypes.INSERT_EVENT]))
  .flatMap(({action, store}) => {
    const timezone = store.scheduler.period.get('timezone');

    return Observable.fromPromise(insertEvent(action.evnt, timezone))
      .map((result) => {
        if (result.error) {
          return EventsActions.insertEventFailure(result.error, action.evnt.id);
        } else {
          return EventsActions.insertEventSuccess(result.response.event, action.evnt.id);
        }
      });
  });

const updateEventInBackend = (iterable) => iterable
  .filter(actionPredicate([EventsActions.actionTypes.UPDATE_EVENT]))
  .flatMap(({action, store}) => {
    const timezone = store.scheduler.period.get('timezone');

    return Observable.fromPromise(updateEvent(action.evnt, timezone))
      .map((result) => {
        if (result.error) {
          return EventsActions.updateEventFailure(result.error, action.evnt.id);
        } else {
          return EventsActions.updateEventSuccess(result.response);
        }
      });
  });

const deleteEventInBackend = (iterable) => iterable
  .filter(actionPredicate([EventsActions.actionTypes.DELETE_EVENT]))
  .flatMap(({action, store}) => {
    return Observable.fromPromise(deleteEvent(action.id))
      .map((result) => {
        if (result.error) {
          return EventsActions.deleteEventFailure(result.error, action.id);
        } else {
          return EventsActions.deleteEventSuccess(result.response.id);
        }
      });
  });

// --------------------
// Modfiy Notifications
// --------------------

const notifications = (iterable) => {
  const insertSuccess = iterable
    .filter(actionPredicate([EventsActions.actionTypes.INSERT_EVENT_SUCCESS]))
    .map(({action, store}) => {
      return NotificationActions.setNotification(`Added event: ${action.evnt.title}`);
    });

  const insertFailure = iterable
    .filter(actionPredicate([EventsActions.actionTypes.INSERT_EVENT_FAILURE]))
    .map(({action, store}) => {
      const evnt = store.scheduler.events.getIn(['events', action.tempId]);
      return NotificationActions.setNotification(`Error adding ${evnt.get('title')}`);
    });

  const updateSuccess = iterable
    .filter(actionPredicate([EventsActions.actionTypes.UPDATE_EVENT_SUCCESS]))
    .map(({action, store}) => {
      return NotificationActions.setNotification(`Updated event: ${action.evnt.title}`);
    });

  const updateFailure = iterable
    .filter(actionPredicate([EventsActions.actionTypes.UPDATE_EVENT_FAILURE]))
    .map(({action, store}) => {
      const evnt = store.scheduler.events.getIn(['events', action.id]);
      return NotificationActions.setNotification(`Error updating ${evnt.get('title')}`);
    });

  const deleteSuccess = iterable
    .filter(actionPredicate([EventsActions.actionTypes.DELETE_EVENT_SUCCESS]))
    .map(({action, store}) => {
      const evnt = store.scheduler.events.getIn(['events', action.id]);
      return NotificationActions.setNotification(`Deleted event: ${evnt.get('title')}`);
    });

  const deleteFailure = iterable
    .filter(actionPredicate([EventsActions.actionTypes.DELETE_EVENT_FAILURE]))
    .map(({action, store}) => {
      const evnt = store.scheduler.events.getIn(['events', action.id]);
      return NotificationActions.setNotification(`Error deleting ${evnt.get('title')}`);
    });

  return Observable.merge(
    insertSuccess,
    insertFailure,
    updateSuccess,
    updateFailure,
    deleteSuccess,
    deleteFailure
  );
};

// System for hiding notifications:  start refreshes
// cancel timer and cancel yields cancel and terminates
// the timer<button>Click me</button>
const hideNotification = (iterable) => {
  const startNotifyStream = iterable
    .filter(actionPredicate([NotificationActions.actionTypes.SET_NOTIFICATION]));

  const cancelNotifyStream = iterable
    .filter(actionPredicate([NotificationActions.actionTypes.CANCEL_NOTIFICATION]));

  return Observable.race(cancelNotifyStream, startNotifyStream.debounceTime(3000))
    .map((x) => NotificationActions.clearNotification())
    .take(1)
    .repeat();
};

// ---------
// Root saga
// ---------

function handleObservableError(message) {
  return function(e) {
    console.error(message, e);
    return Observable.empty();
  };
}

export default function root(iterable) {
  return Observable.merge(
    changePeriodOnPathChange(iterable).catch(
      handleObservableError('changePeriodOnPathChange error')
    ),
    fetchData(iterable).catch(
      handleObservableError('fetchData error')
    ),
    insertEventInBackend(iterable).catch(
      handleObservableError('insertEventInBackend error')
    ),
    updateEventInBackend(iterable).catch(
      handleObservableError('updateEventInBackend error')
    ),
    deleteEventInBackend(iterable).catch(
      handleObservableError('deleteEventInBackend error')
    ),
    hideNotification(iterable).catch(
      handleObservableError('Hide Notification error')
    ),
    notifications(iterable).catch(
      handleObservableError('Notification error')
    ),
    allDayDnd(iterable).catch(
      handleObservableError('All Day DnD error')
    )
  );
}
