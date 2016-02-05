import thunk from 'redux-thunk';
import rootReducer from './rootReducer';
import schedulerSaga from 'sagas/scheduler';
import sagaMiddleware from 'redux-saga';
import {
  applyMiddleware,
  compose,
  createStore
} from 'redux';

export default function configureStore (initialState) {
  let createStoreWithMiddleware;
  const middleware = applyMiddleware(
    thunk,
    sagaMiddleware(schedulerSaga)
  );

  if (__DEBUG__) {
    createStoreWithMiddleware = compose(
      middleware,
      window.devToolsExtension
        ? window.devToolsExtension()
        : require('containers/DevTools').default.instrument()
    );
  } else {
    createStoreWithMiddleware = compose(middleware);
  }

  const store = createStoreWithMiddleware(createStore)(
    rootReducer, initialState
  );
  if (module.hot) {
    module.hot.accept('./rootReducer', () => {
      const nextRootReducer = require('./rootReducer').default;

      store.replaceReducer(nextRootReducer);
    });
  }
  return store;
}
