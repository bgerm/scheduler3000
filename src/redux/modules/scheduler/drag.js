// ------------------------------------
// Action Types
// ------------------------------------
const UPDATE_DRAG = 'scheduler/drag/UPDATE_DRAG';
const RESET_DRAG = 'scheduler/drag/RESET_DRAG';

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
  startCell: null,
  lastCell: null,
  stopDrag: false,
  mouse: { x: 0, y: 0 },
  mouseDelta: {x: 0, y: 0},
  originPosition: {left: 0, top: 0},
  targetId: null,
  isWide: false,
  initialDrag: false
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
      return initialState;

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
