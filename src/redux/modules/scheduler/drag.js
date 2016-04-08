// ------------------------------------
// Action Types
// ------------------------------------
const UPDATE_DRAG = 'scheduler/drag/UPDATE_DRAG';
const RESET_DRAG = 'scheduler/drag/RESET_DRAG';
const CANCEL_DRAG = 'scheduler/drag/CANCEL_DRAG';
const NEW_MOUSE_DOWN = 'scheduler/drag/NEW_MOUSE_DOWN';
const EDIT_MOUSE_DOWN = 'scheduler/drag/EDIT_MOUSE_DOWN';
const ENTER_CELL = 'scheduler/drag/ENTER_CELL';
const UPDATE_GRID_RECT = 'scheduler/drag/UPDATE_GRID_RECT';

export const actionTypes = {
  CANCEL_DRAG,
  NEW_MOUSE_DOWN,
  EDIT_MOUSE_DOWN,
  UPDATE_GRID_RECT,
  ENTER_CELL,
  UPDATE_DRAG
};

// ------------------------------------
// Reducers
// ------------------------------------
export const DRAG_TYPES = {
  none: 'none',
  create: 'create',
  edit: 'edit',
  show: 'show'
};

const initialState = {
  dragType: DRAG_TYPES.none,
  dragging: false,
  startDate: null,
  endDate: null,
  stopDrag: false,
  mouse: { x: 0, y: 0 },
  mouseDelta: {x: 0, y: 0},
  originPosition: {left: 0, top: 0},
  targetId: null,
  isWide: false,
  initialDrag: false,
  gridRect: null,
  height: 0,
  width: 0
};

// Reducer
export default function scheduler(state = initialState, action) {
  switch (action.type) {
    case UPDATE_DRAG:
      const drag = action.drag;

      if (drag.dragType === DRAG_TYPES.none) {
        return initialState;
      }

      return {
        ...state,
        ...drag,
        dragging: drag.dragType !== DRAG_TYPES.none
      };

    case RESET_DRAG:
      const rects = state.rects;

      return {
        ...initialState,
        rects
      };

    case UPDATE_GRID_RECT:
      return {
        ...initialState,
        gridRect: action.gridRect
      };

    default:
      return state;
  }
}

// ------------------------------------
// Action Creators
// ------------------------------------
export function updateDrag(drag) {
  return {
    type: UPDATE_DRAG,
    drag: drag
  };
}

export function resetDrag() {
  return {
    type: RESET_DRAG
  };
}

export function cancelDrag() {
  return {
    type: CANCEL_DRAG
  };
}

export function newMouseDown(mouseEvent, scrollbarWidth) {
  return {
    type: NEW_MOUSE_DOWN,
    mouseEvent,
    scrollbarWidth
  };
}

export function enterCell(mouseEvent, date) {
  return {
    type: ENTER_CELL,
    mouseEvent,
    date
  };
}

// TODO
/*
export function editMouseDown(mouseEvent, targetId, startDate, endDate, pageOffset, allDay) {
  return {
    type: EDIT_MOUSE_DOWN,
    mouseEvent,
    targetId,
    startDate,
    endDate,
    pageOffset,
    allDay
  };
}
*/

export function editMouseDown(mouseEvent, calendarEvent, scrollbarWidth) {
  return {
    type: EDIT_MOUSE_DOWN,
    mouseEvent,
    calendarEvent,
    scrollbarWidth
  };
}

export function updateGridRect(gridRect) {
  return {
    type: UPDATE_GRID_RECT,
    gridRect: gridRect
  };
}
