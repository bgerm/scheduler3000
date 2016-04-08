import Immutable from 'immutable';

const SET_THEME = 'scheduler/period/SET_THEME';

// ------------------------------------
// Reducer
// ------------------------------------

export const initialState = Immutable.fromJS({
  theme: 'default'
});

// Reducer
export default function userSettingsReducer(state = initialState, action) {
  switch (action.type) {
    case SET_THEME:
      return state.set('theme', action.theme);

    default:
      return state;
  }
}

// ------------------------------------
// Action Creators
// ------------------------------------
export function setTheme(theme) {
  return {
    type: SET_THEME,
    theme: theme
  };
}

