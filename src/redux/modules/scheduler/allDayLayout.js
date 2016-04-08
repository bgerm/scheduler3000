import Immutable from 'immutable';

// ------------------------------------
// Action Types
// ------------------------------------
const UPDATE_GRID = 'scheduler/allDayLayout/UPDATE_GRID';

export const actionTypes = {
  UPDATE_GRID
};

// ------------------------------------
// Reducers
// ------------------------------------
const initialState = Immutable.fromJS({
  grid: null // TODO where do we adjust for scrollbars
});

// Reducer
export default function allDayLayout(state = initialState, action) {
  switch (action.type) {
    case UPDATE_GRID:
      return state.set('grid', action.grid);

    default:
      return state;
  }
}

// ------------------------------------
// Action Creators
// ------------------------------------
export function updateAllDayGrid(grid) {
  return {
    type: UPDATE_GRID,
    grid: Immutable.fromJS(grid)
  };
}
