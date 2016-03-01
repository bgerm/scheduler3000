import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import scheduler from './modules/scheduler';

export default combineReducers({
  scheduler,
  router
});
