// ------------------------------------
// Action Types
// ------------------------------------
const SHOW_CREATE_MODAL = 'scheduler/eventModal/SHOW_CREATE_MODAL';
const SHOW_SUMMARY_MODAL = 'scheduler/eventModal/SHOW_SUMMARY_MODAL';
const HIDE_MODAL = 'scheduler/eventModal/HIDE_MODAL';

export const actionTypes = {
  SHOW_CREATE_MODAL,
  SHOW_SUMMARY_MODAL,
  HIDE_MODAL
};

// ------------------------------------
// Reducers
// ------------------------------------
const showTypes = {
  none: 'none',
  create: 'create',
  summary: 'summary'
};

const initialState = {
  show: showTypes.none,
  id: null,
  startDate: null,
  endDate: null
};

// Reducer
export default function eventModal(state = initialState, action) {
  switch (action.type) {
    case HIDE_MODAL:
      return initialState;

    case SHOW_CREATE_MODAL:
      return {
        show: showTypes.create,
        id: action.id,
        startDate: action.startDate,
        endDate: action.endDate
      };

    case SHOW_SUMMARY_MODAL:
      return {
        show: showTypes.summary,
        id: action.id,
        startDate: null,
        endDate: null
      };

    default:
      return state;
  }
}

// ------------------------------------
// Action Creators
// ------------------------------------
export function hideModal() {
  return {
    type: HIDE_MODAL
  };
}

export function showCreateModal(id, startDate, endDate) {
  return {
    type: SHOW_CREATE_MODAL,
    id: id,
    startDate: startDate,
    endDate: endDate
  };
}

export function showSummaryModal(id) {
  return {
    type: SHOW_SUMMARY_MODAL,
    id: id
  };
}
