import thunk from 'redux-thunk';
import rootReducer from './rootReducer';
import schedulerSaga from 'sagas/scheduler';
import { Subject } from 'rxjs';
import { routerMiddleware } from 'react-router-redux';
import {
  applyMiddleware,
  compose,
  createStore
} from 'redux';

const sagaMiddleware = (saga) => {
  const subject = new Subject();

  return (store) => {
    saga(subject).subscribe((dispatchable) => store.dispatch(dispatchable));

    return (next) => (action) => {
      next(action);
      subject.next({action: action, store: store.getState()});
    };
  };
};

export default function configureStore (initialState = {}, history) {
  // Compose final middleware and use devtools in debug environment
  let middleware = applyMiddleware(
    thunk,
    routerMiddleware(history),
    sagaMiddleware(schedulerSaga)
  );

  if (__DEBUG__) {
    const devTools = window.devToolsExtension
      ? window.devToolsExtension()
      : require('containers/DevTools').default.instrument();
    middleware = compose(middleware, devTools);
  }

  // Create final store and subscribe router in debug env ie. for devtools
  const store = middleware(createStore)(rootReducer, initialState);

  if (module.hot) {
    module.hot.accept('./rootReducer', () => {
      const nextRootReducer = require('./rootReducer').default;

      store.replaceReducer(nextRootReducer);
    });
  }
  return store;
}
