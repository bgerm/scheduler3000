import React from 'react';
import { PropTypes } from 'react';
import themes from 'components/Scheduler/themes';
import classNames from 'classNames';
import DaysOfWeek from 'components/Scheduler/AllDay/DaysOfWeek';
import styles from './MonthlyContainer.scss';
import CSSModules from 'react-css-modules';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as EventsActions from 'redux/modules/scheduler/events';
import * as DragActions from 'redux/modules/scheduler/drag';
import * as AllDayLayoutActions from 'redux/modules/scheduler/allDayLayout';
import NewModal from 'components/Scheduler/NewModal';
import SummaryModal from 'components/Scheduler/SummaryModal';
import { DRAG_TYPES } from 'redux/modules/scheduler/drag';
import { actions as FormActions } from 'react-redux-form';
import AllDay from 'components/Scheduler/AllDay';
import {
  periodSelector,
  userSettingsSelector,
  positionEventsSelector,
  justEventsSelector
} from 'redux/modules/scheduler/selectors';

const propTypes = {
  period: PropTypes.object.isRequired,
  drag: PropTypes.object.isRequired,
  events: PropTypes.object.isRequired,
  positioned: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  newEvent: PropTypes.object.isRequired,
  newEventForm: PropTypes.object.isRequired,
  userSettings: PropTypes.object.isRequired
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
      newEventForm,
      userSettings
    } = this.props;

    const { eventsActions, dragActions, formActions, allDayLayoutActions } = actions;
    const theme = themes[userSettings.get('theme', 'default')].allDay;

    const styleNames = classNames('vflex');

    return (
      <div className={styleNames} style={{height: '100%'}}>
        <DaysOfWeek />

        <div styleName='monthly-container'>
          <AllDay
            period={period}
            drag={drag}
            positioned={positioned}
            events={events}
            updateAllDayGrid={allDayLayoutActions.updateAllDayGrid}
            theme={theme}
            newMouseDown={dragActions.newMouseDown}
            editMouseDown={dragActions.editMouseDown}
            overflow={false}
            showDayLabels
          />
          {drag.dragType === DRAG_TYPES.create &&
            drag.stopDrag && (
            <NewModal
              onClose={dragActions.cancelDrag}
              startDate={drag.startDate}
              endDate={drag.endDate}
              newEvent={newEvent}
              newEventForm={newEventForm}
              formActions={formActions}
              insertEvent={eventsActions.insertEvent}
            />
          )}
          {drag.dragType === DRAG_TYPES.show &&
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
  const { drag, newEvent, newEventForm } = state.scheduler;

  return {
    period: periodSelector(state),
    drag,
    events: justEventsSelector(state).get('events'),
    newEvent,
    newEventForm,
    positioned: positionEventsSelector(true)(state),
    userSettings: userSettingsSelector(state)
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    actions: {
      eventsActions: bindActionCreators(EventsActions, dispatch),
      dragActions: bindActionCreators(DragActions, dispatch),
      formActions: bindActionCreators(FormActions, dispatch),
      allDayLayoutActions: bindActionCreators(AllDayLayoutActions, dispatch)
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(StyledMonthlyContainer);
