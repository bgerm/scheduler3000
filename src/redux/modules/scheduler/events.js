import { merge, omitBy, pull } from 'lodash';
import Immutable from 'immutable';

// ------------------------------------
// Action Types
// ------------------------------------
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

const UPDATE_POSITIONED = 'scheduler/events/UPDATE_POSITIONED';
const UPDATE_SHOW_LIMIT = 'scheduler/events/UPDATE_SHOW_LIMIT';

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
  DELETE_EVENT,
  UPDATE_SHOW_LIMIT
};

// ------------------------------------
// Reducers
// ------------------------------------
const initialState = {
  fetching: [],
  events: {},
  result: [],
  positionedEvents: Immutable.Map({}),
  showLimit: null
};

// Reducer
export default function events(state = initialState, action) {
  let newEvent;

  switch (action.type) {
    case LOAD_EVENTS_SUCCESS:
      return {
        ...state,
        events: merge({}, state.events, action.events),
        result: action.result,
        fetching: state.fetching.slice(1),
        positionedEvents: state.positionedEvents
      };

    case LOAD_EVENTS_FAILURE:
      // TODO alert of errors somewhere
      return {
        ...state,
        fetching: state.fetching.slice(1)
      };

    case INSERT_EVENT:
      newEvent = {
        ...action.evnt,
        saving: true
      };

      state.events[action.evnt.id] = newEvent;
      state.result.push(action.evnt.id);

      return {
        ...state,
        fetching: state.fetching.concat(1)
      };

    case INSERT_EVENT_SUCCESS:
      state.events[action.tempId].deleted = true;

      state.events[action.evnt.id] = action.evnt;
      state.result.push(action.evnt.id);

      return {
        ...state,
        fetching: state.fetching.slice(1),
        result: pull(state.result, action.tempId)
      };

    case INSERT_EVENT_FAILURE:
      console.log('insert event failure', action); // TODO handle

      return {
        ...state,
        fetching: state.fetching.slice(1)
      };

    case UPDATE_EVENT:
      newEvent = {
        ...state.events[action.evnt.id],
        ...omitBy(action.evnt, x => x === undefined),
        saving: true
      };

      state.events[action.evnt.id] = newEvent;

      return {
        ...state,
        fetching: state.fetching.concat(1)
      };

    case UPDATE_EVENT_SUCCESS:
      newEvent = {
        ...state.events[action.evnt.id],
        ...omitBy(action.evnt, x => x === undefined),
        saving: false
      };

      state.events[action.evnt.id] = newEvent;

      return {
        ...state,
        fetching: state.fetching.slice(1)
      };

    case UPDATE_EVENT_FAILURE:
      console.log('update event failure', action); // TODO handle

      return {
        ...state,
        fetching: state.fetching.slice(1)
      };

    case DELETE_EVENT:
      newEvent = {
        ...state.events[action.id],
        saving: true
      };

      state.events[action.id] = newEvent;

      return {
        ...state,
        fetching: state.fetching.concat(1)
      };

    case DELETE_EVENT_SUCCESS:
      newEvent = {
        ...state.events[action.id],
        saving: false,
        deleted: true
      };

      state.events[action.id] = newEvent;

      return {
        ...state,
        result: pull(state.result, action.id),
        fetching: state.fetching.slice(1)
      };

    case DELETE_EVENT_FAILURE:
      console.log('delete event failure', action); // TODO handle

      return {
        ...state,
        fetching: state.fetching.slice(1)
      };

    case UPDATE_POSITIONED:
      return {
        ...state,
        positionedEvents: Immutable.fromJS(action.positioned)
      };

    case UPDATE_SHOW_LIMIT:
      return {
        ...state,
        showLimit: action.showLimit
      };

    case PUSH_FETCHING:
      return {
        ...state,
        fetching: state.fetching.concat(1)
      };

    case POP_FETCHING:
      return {
        ...state,
        fetching: state.fetching.slice(1)
      };

    default:
      return state;
  }
}

// ------------------------------------
// Action Creators
// ------------------------------------
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

export function updatePositioned(positioned) {
  return {
    type: UPDATE_POSITIONED,
    positioned: positioned
  };
}

export function updateShowLimit(showLimit) {
  return {
    type: UPDATE_SHOW_LIMIT,
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
