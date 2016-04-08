import Immutable from 'immutable';
import { omitBy } from 'lodash';

// Action Types
const INSERT_EVENT = 'scheduler/events/INSERT_EVENT';
const UPDATE_EVENT = 'scheduler/events/UPDATE_EVENT';
const DELETE_EVENT = 'scheduler/events/DELETE_EVENT';

const LOAD_EVENTS_SUCCESS = 'scheduler/events/LOAD_EVENTS_SUCCESS';
const LOAD_EVENTS_FAILURE = 'scheduler/events/LOAD_EVENTS_FAILURE';

const INSERT_EVENT_REQUEST = 'scheduler/events/INSERT_EVENT_REQUEST';
const INSERT_EVENT_SUCCESS = 'scheduler/events/INSERT_EVENT_SUCCESS';
const INSERT_EVENT_FAILURE = 'scheduler/events/INSERT_EVENT_FAILURE';

const UPDATE_EVENT_REQUEST = 'scheduler/events/UPDATE_EVENT_REQUEST';
const UPDATE_EVENT_SUCCESS = 'scheduler/events/UPDATE_EVENT_SUCCESS';
const UPDATE_EVENT_FAILURE = 'scheduler/events/UPDATE_EVENT_FAILURE';

const DELETE_EVENT_REQUEST = 'scheduler/events/DELETE_EVENT_REQUEST';
const DELETE_EVENT_SUCCESS = 'scheduler/events/DELETE_EVENT_SUCCESS';
const DELETE_EVENT_FAILURE = 'scheduler/events/DELETE_EVENT_FAILURE';

const PUSH_FETCHING = 'scheduler/events/PUSH_FETCHING';
const POP_FETCHING = 'scheduler/events/POP_FETCHING';

export const actionTypes = {
  LOAD_EVENTS_SUCCESS,
  LOAD_EVENTS_FAILURE,
  INSERT_EVENT_REQUEST,
  INSERT_EVENT_SUCCESS,
  INSERT_EVENT_FAILURE,
  UPDATE_EVENT_REQUEST,
  UPDATE_EVENT_SUCCESS,
  UPDATE_EVENT_FAILURE,
  DELETE_EVENT_REQUEST,
  DELETE_EVENT_SUCCESS,
  DELETE_EVENT_FAILURE,
  UPDATE_EVENT,
  INSERT_EVENT,
  DELETE_EVENT
};

// Reducer
const initialState = Immutable.fromJS({
  fetching: [],
  events: {},
  result: []
});

const enqueue = (list) => list.push(1);
const dequeue = (list) => list.pop();

export default function events(state = initialState, action) {
  switch (action.type) {
    case LOAD_EVENTS_SUCCESS:
      return state.withMutations((map) => {
        map.set('result', Immutable.fromJS(action.result));
        map.mergeIn(['events'], Immutable.fromJS(action.events));
        map.update('fetching', dequeue);
      });

    case LOAD_EVENTS_FAILURE:
      return state.update('fetching', dequeue);

    case INSERT_EVENT:
      return state.withMutations((map) => {
        map.setIn(['events', action.evnt.id],
          Immutable.fromJS({...action.evnt, saving: true}));
        map.update('result', (result) => result.push(action.evnt.id));
        map.update('fetching', enqueue);
      });

    case INSERT_EVENT_SUCCESS:
      return state.withMutations((map) => {
        map.setIn(['events', action.tempId, 'deleted'], true);
        map.setIn(['events', action.evnt.id], Immutable.fromJS(action.evnt));
        map.update('result', (result) => result.push(action.evnt.id));
        map.update('result', (result) => result.filterNot((id) => id === action.tempId));
        map.update('fetching', dequeue);
      });

    case INSERT_EVENT_FAILURE:
      // TODO also do something else?
      return state.update('fetching', dequeue);

    case UPDATE_EVENT:
      return state.withMutations((map) => {
        map.mergeIn(['events', action.evnt.id],
          Immutable.fromJS({
            ...omitBy(action.evnt, (x) => x === undefined),
            saving: true
          }));
        map.update('fetching', enqueue);
      });

    case UPDATE_EVENT_SUCCESS:
      return state.withMutations((map) => {
        map.mergeIn(['events', action.evnt.id],
          Immutable.fromJS({
            ...omitBy(action.evnt, (x) => x === undefined),
            saving: false
          }));
        map.update('fetching', dequeue);
      });

    case UPDATE_EVENT_FAILURE:
      // TODO also do something else?
      return state.update('fetching', dequeue);

    case DELETE_EVENT:
      return state.withMutations((map) => {
        map.setIn(['events', action.id, 'saving'], true);
        map.update('fetching', enqueue);
      });

    case DELETE_EVENT_SUCCESS:
      return state.withMutations((map) => {
        map.mergeIn(['events', action.id],
          Immutable.fromJS({deleted: true, saving: false}));
        map.update('fetching', dequeue);
        map.update('result', (result) => result.filterNot((id) => id === action.id));
      });

    case DELETE_EVENT_FAILURE:
      // TODO also do something else?
      return state.update('fetching', dequeue);

    case PUSH_FETCHING:
      return state.update('fetching', enqueue);

    case POP_FETCHING:
      return state.update('fetching', dequeue);

    default:
      return state;
  }
}

// Action Creators
export function loadEventsSuccess(events, result) {
  return {
    type: LOAD_EVENTS_SUCCESS,
    events,
    result
  };
}

export function loadEventsFailure(error) {
  return {
    type: LOAD_EVENTS_FAILURE,
    error
  };
}

export function insertEvent({id, title, startDate, endDate, allDay}) {
  return {
    type: INSERT_EVENT,
    evnt: {id: id, title, startDate, endDate, allDay}
  };
}

// TODO improve
export function updateEvent({id, title, startDate, endDate, allDay}) {
  return {
    type: UPDATE_EVENT,
    evnt: {id, title, startDate, endDate, allDay}
  };
}

export function deleteEvent(id) {
  return {
    type: DELETE_EVENT,
    id: id
  };
}

// TODO REMOVE
export function updatePositioned(positioned) {
  return {
    type: 'foo',
    positioned: positioned
  };
}

// TODO REMOVE
export function updateShowLimit(showLimit) {
  return {
    type: 'foo',
    showLimit: showLimit
  };
}

export function insertEventSuccess(evnt, tempId) {
  return {
    type: INSERT_EVENT_SUCCESS,
    evnt: evnt,
    tempId: tempId
  };
}

export function insertEventFailure(error, tempId) {
  return {
    type: INSERT_EVENT_FAILURE,
    error: error,
    tempId: tempId
  };
}

export function updateEventSuccess(evnt) {
  return {
    type: UPDATE_EVENT_SUCCESS,
    evnt: evnt
  };
}

export function updateEventFailure(error, id) {
  return {
    type: UPDATE_EVENT_FAILURE,
    error: error,
    id: id
  };
}

export function deleteEventSuccess(id) {
  return {
    type: DELETE_EVENT_SUCCESS,
    id: id
  };
}

export function deleteEventFailure(error, id) {
  return {
    type: DELETE_EVENT_FAILURE,
    error: error,
    id: id
  };
}

export function pushFetching() {
  return {
    type: PUSH_FETCHING
  };
}

export function popFetching() {
  return {
    type: POP_FETCHING
  };
}
