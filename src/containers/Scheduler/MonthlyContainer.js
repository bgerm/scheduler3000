import { PropTypes } from 'react';
import classNames from 'classNames';
import DaysOfWeek from 'components/Scheduler/Monthly/DaysOfWeek';
import DaysGrid from 'components/Scheduler/Monthly/DaysGrid';
import EventsGrid from 'components/Scheduler/Monthly/EventsGrid';
import styles from './MonthlyContainer.scss';
import CSSModules from 'react-css-modules';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as EventsActions from 'redux/modules/scheduler/events';
import * as DragActions from 'redux/modules/scheduler/drag';
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
            enterCell={dragActions.enterCell}
            newMouseDown={dragActions.newMouseDown}
            updateRects={dragActions.updateRects}
          />
          <EventsGrid
            period={period}
            events={events}
            positioned={positioned}
            dragId={drag.targetId}
            editMouseDown={dragActions.editMouseDown}
            updateShowLimit={eventsActions.updateShowLimit}
          />
          { drag.dragType === DRAG_TYPES.create &&
            drag.stopDrag && (
            <NewModal
              onClose={dragActions.cancelDrag}
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
              onClose={dragActions.cancelDrag}
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
