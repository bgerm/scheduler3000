// ------------------------------------
// Action Types
// ------------------------------------
const SET_NOTIFICATION = 'scheduler/notification/SET_NOTIFICATION';
const CLEAR_NOTIFICATION = 'scheduler/notification/CLEAR_NOTIFICATION';
const CANCEL_NOTIFICATION = 'scheduler/notification/CANCEL_NOTIFICATION';

export const actionTypes = {
  SET_NOTIFICATION,
  CLEAR_NOTIFICATION,
  CANCEL_NOTIFICATION
};

// ------------------------------------
// Reducers
// ------------------------------------
const initialState = '';

// Reducer
export default function eventModal(state = initialState, action) {
  switch (action.type) {
    case SET_NOTIFICATION:
      return action.message;

    case CLEAR_NOTIFICATION:
      return initialState;

    default:
      return state;
  }
}

// ------------------------------------
// Action Creators
// ------------------------------------
export function setNotification(message) {
  return {
    type: SET_NOTIFICATION,
    message
  };
}

export function clearNotification() {
  return {
    type: CLEAR_NOTIFICATION
  };
}

export function cancelNotification() {
  return {
    type: CANCEL_NOTIFICATION
  };
}
