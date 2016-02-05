import { PropTypes } from 'react';
import classNames from 'classNames';
import DaysOfWeek from 'components/Scheduler/Monthly/DaysOfWeek';
import DaysGrid from 'components/Scheduler/Monthly/DaysGrid';
import EventsGrid from 'components/Scheduler/Monthly/EventsGrid';
import styles from './MonthlyContainer.scss';
import CSSModules from 'react-css-modules';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { FuncSubject } from 'rx-react';
import { fetchEvents } from 'services/api';
import * as EventsActions from 'redux/modules/scheduler/events';
import * as DragActions from 'redux/modules/scheduler/drag';
import Rx from 'rx';
import NewModal from 'components/Scheduler/NewModal';
import SummaryModal from 'components/Scheduler/SummaryModal';
import { DRAG_TYPES } from 'redux/modules/scheduler/drag';
import { actions as FormActions } from 'react-redux-form';

const propTypes = {
  period: PropTypes.object.isRequired,
  drag: PropTypes.object.isRequired,
  events: PropTypes.object.isRequired,
  positioned: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  newEvent: PropTypes.object.isRequired,
  newEventForm: PropTypes.object.isRequired
};

export default class MonthlyContainer extends React.Component {
  componentWillMount() {
    this.editStream = FuncSubject.create(
      (event, id, startDate, endDate, pageOffset) => ({
        evnt: event, id, startDate, endDate, pageOffset
      })
    );

    this.cancelDragStream = FuncSubject.create();
  }

  constructor(props) {
    super(props);

    this.__propsSubject = new Rx.BehaviorSubject(props);
    this.propsStream = this.__propsSubject.asObservable();

    // load events
    // Would be great if this were somewhere else, like
    // with the rest of the async events in the scheduler
    // saga
    const dataChangedStream = this.propsStream
      .map(x => ({actions: x.actions, period: x.period}))
      .distinctUntilChanged(x => x.period)
      .debounce(250);

    const fetchStream = dataChangedStream.map(x => {
      const { period, actions } = x;

      const startDate = period.get('startDate');
      const endDate = period.get('endDate');
      const timezone = period.get('timezone');

      // do indexing
      return Rx.Observable.fromPromise(fetchEvents({startDate, endDate, timezone: timezone}))
        .map(data => {
          const { response, error } = data;
          if (response) {
            const events = response.entities.events;
            const result = response.result.events;

            return { events, result, actions };
          } else {
            return { error, actions };
          }
        });
    })
    .switch();

    dataChangedStream
      .map(x => true)
      .merge(fetchStream.map(x => false))
      .distinctUntilChanged()
      .subscribe(x => {
        const { actions } = this.props;

        // loadEvents{Failure,Success} takes care of popping fetch status
        if (x) {
          actions.eventsActions.pushFetching();
        }
      });

    fetchStream.subscribe(x => {
      const { error, events, result, actions } = x;

      if (error) {
        actions.eventsActions.loadEventsFailure(error);
      } else {
        actions.eventsActions.loadEventsSuccess(events, result);
      }
    });
  }

  componentWillReceiveProps(props) {
    this.__propsSubject.onNext(props);
  }

  componentWillUnmount() {
    this.__propsSubject.onCompleted();
  }

  render() {
    const {
      actions,
      period,
      events,
      positioned,
      drag,
      newEvent,
      newEventForm
    } = this.props;

    const { eventsActions, dragActions, formActions } = actions;

    const styleNames = classNames(
      'vflex',
      { 'disable-pointer-events': drag.dragging }
    );

    return (
      <div className={styleNames} style={{height: '100%'}}>
        <DaysOfWeek />

        <div styleName='monthly-container'>
          <DaysGrid
            period={period}
            drag={drag}
            dragTargetEvent={events[drag.targetId]}
            editStream={this.editStream}
            updateDrag={dragActions.updateDrag}
            resetDrag={dragActions.resetDrag}
            updateEvent={eventsActions.updateEvent}
            cancelDragStream={this.cancelDragStream}
          />
          <EventsGrid
            period={period}
            events={events}
            positioned={positioned}
            dragId={drag.targetId}
            editStream={this.editStream}
            updateShowLimit={eventsActions.updateShowLimit}
          />
          { drag.dragType === DRAG_TYPES.create &&
            drag.stopDrag && (
            <NewModal
              onClose={() => this.cancelDragStream()}
              startDate={drag.startCell.isAfter(drag.lastCell) ? drag.lastCell : drag.startCell}
              endDate={drag.startCell.isAfter(drag.lastCell) ? drag.startCell : drag.lastCell}
              newEvent={newEvent}
              newEventForm={newEventForm}
              formActions={formActions}
              insertEvent={eventsActions.insertEvent}
            />
          )}
          { drag.dragType === DRAG_TYPES.show &&
            drag.stopDrag && (
            <SummaryModal
              onClose={() => this.cancelDragStream()}
              eventId={drag.targetId}
              events={events}
              deleteEvent={eventsActions.deleteEvent}
            />
          )}
        </div>
      </div>
    );
  }
}

MonthlyContainer.propTypes = propTypes;
const StyledMonthlyContainer = CSSModules(MonthlyContainer, styles, {allowMultiple: true});

const mapStateToProps = (state, props) => {
  const { events, period, drag, newEvent, newEventForm } = state.scheduler;

  return {
    period,
    drag,
    events: events.events,
    positioned: events.positionedEvents,
    newEvent,
    newEventForm
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: {
      eventsActions: bindActionCreators(EventsActions, dispatch),
      dragActions: bindActionCreators(DragActions, dispatch),
      formActions: bindActionCreators(FormActions, dispatch)
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(StyledMonthlyContainer);
