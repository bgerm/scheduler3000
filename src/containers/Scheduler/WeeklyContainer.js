import React, { PropTypes } from 'react';
import styles from './WeeklyContainer.scss';
import CSSModules from 'react-css-modules';
import { range } from 'lodash';
import classNames from 'classNames';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as EventsActions from 'redux/modules/scheduler/events';
import * as DragActions from 'redux/modules/scheduler/drag';
import DaysOfWeek from 'components/Scheduler/Weekly/DaysOfWeek';
import { actions as FormActions } from 'react-redux-form';
import * as AllDayLayoutActions from 'redux/modules/scheduler/allDayLayout';
import AllDay from 'components/Scheduler/AllDay';
import themes from 'components/Scheduler/themes';
import NewModal from 'components/Scheduler/NewModal';
import SummaryModal from 'components/Scheduler/SummaryModal';
import { DRAG_TYPES } from 'redux/modules/scheduler/drag';
import {
  periodSelector,
  userSettingsSelector,
  positionEventsSelector,
  justEventsSelector
} from 'redux/modules/scheduler/selectors';

const propTypes = {
  period: PropTypes.object.isRequired,
  events: PropTypes.object.isRequired,
  positioned: PropTypes.object.isRequired,
  actions: PropTypes.object.isRequired,
  drag: PropTypes.object.isRequired,
  userSettings: PropTypes.object.isRequired,
  newEvent: PropTypes.object.isRequired,
  newEventForm: PropTypes.object.isRequired
};

export default class WeeklyContainer extends React.Component {
  render() {
    const { userSettings, period, drag, positioned, events, actions, newEvent, newEventForm } = this.props;
    const theme = themes[userSettings.get('theme', 'default')].allDay;

    const { dragActions, allDayLayoutActions, formActions, eventsActions } = actions;

    const hours = range(0, 24).map((hour) => {
      const styleNames = classNames(
        'full',
        {'off-hour': hour < 9 || hour > 18}
      );

      return (
        <div key={hour} styleName={styleNames}>
        </div>
      );
    });

    const hourMarkers = range(0, 24).map((hour) => {
      const amPm = hour >= 11 ? 'PM' : 'AM';
      const showHour = ((hour + 11) % 12) + 1;

      return (
        <div key={`marker-${hour}`} styleName='hour-marker'>
          {showHour} {amPm}
        </div>
      );
    });

    const eventColumns = range(0, 7).map((day) => {
      const styleNames = classNames(
        'cell',
        {'today': day === 1}
      );

      return (
        <div key={`day-column-${day}`} styleName={styleNames}>
        </div>
      );
    });

    return (
      <div className='vflex' style={{height: '100%', overflow: 'hidden'}}>
        <DaysOfWeek period={period} />

        <div styleName='all-day'>
          <div styleName='all-day-container'>
            <div styleName='all-day-wrapper'>
              <AllDay
                period={period}
                drag={drag}
                positioned={positioned}
                events={events}
                updateAllDayGrid={allDayLayoutActions.updateAllDayGrid}
                theme={theme}
                overflow
                newMouseDown={dragActions.newMouseDown}
                editMouseDown={dragActions.editMouseDown}
                showDayLabels={false}
              />
            </div>
            {/* <Week /> */}
          </div>
        </div>
        <div styleName='weekly-container'>
          <div styleName='grid-container' className='clearfix'>
            <div styleName='hour-markers'>
              {hourMarkers}
            </div>
            <div styleName='grid'>
              {hours}
            </div>
          </div>
          <div styleName='events-container'>
            {eventColumns}
          </div>
          <div styleName='now-marker' style={{top: '300px'}}></div>
        </div>
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
    );
  }
}

WeeklyContainer.propTypes = propTypes;
const StyledWeeklyContainer = CSSModules(WeeklyContainer, styles, {allowMultiple: true});

const mapStateToProps = (state, props) => {
  const { drag, newEvent, newEventForm } = state.scheduler;

  return {
    period: periodSelector(state),
    drag,
    events: justEventsSelector(state).get('events'),
    newEvent,
    newEventForm,
    positioned: positionEventsSelector(false)(state),
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
)(StyledWeeklyContainer);
