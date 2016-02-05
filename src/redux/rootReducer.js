import { combineReducers } from 'redux';
import { routeReducer as router } from 'redux-simple-router';
import scheduler from './modules/scheduler';

export default combineReducers({
  scheduler,
  router
});
