import Immutable from 'immutable';
import {
  /* actionTypes,
  loadEventsSuccess,
  loadEventsFailure, */
  default as eventReducer
} from 'redux/modules/scheduler/immutableEvents';

describe('(Redux Module) Counter', function () {
  describe('(Reducer)', function () {
    it('Should be a function.', function () {
      expect(eventReducer).to.be.a('function');
    });

    it('Should initialize with a state of fetching, events, and result.', function () {
      const expectedState = Immutable.fromJS({
        fetching: [],
        events: {},
        result: []
      });

      const reducedState = eventReducer(undefined, {});
      expect(Immutable.is(reducedState, expectedState)).to.be.true;
    });
  });
});
