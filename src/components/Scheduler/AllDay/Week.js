import React, { PropTypes } from 'react';
import styles from './Week.scss';
import CSSModules from 'react-css-modules';
import WeekGrid from './WeekGrid';
import momentPropType from 'utils/PropTypes/momentPropType';
import WeekEvents from './WeekEvents';

const propTypes = {
  period: PropTypes.object.isRequired,
  drag: PropTypes.object.isRequired,
  height: PropTypes.string.isRequired,
  onWeekMouseDown: PropTypes.func.isRequired,
  onEventMouseDown: PropTypes.func.isRequired,
  startDate: momentPropType.isRequired,
  endDate: momentPropType.isRequired,
  events: PropTypes.object.isRequired,
  positioned: PropTypes.object,
  theme: PropTypes.object.isRequired,
  overflow: PropTypes.bool.isRequired,
  showDayLabels: PropTypes.bool.isRequired
};

class Week extends React.Component {
  render() {
    const {
      onWeekMouseDown, onEventMouseDown,
      period, drag, height, startDate,
      endDate, events, positioned, theme,
      overflow, showDayLabels
    } = this.props;

    const weekStyle = {height: height};

    /* eslint-disable react/jsx-no-bind */
    return (
      <div ref='week' styleName='week' style={weekStyle}>
        <WeekGrid
          period={period}
          startDate={startDate}
          endDate={endDate}
          drag={drag}
          overflow={overflow}
        />
        <WeekEvents
          period={period}
          startDate={startDate}
          endDate={endDate}
          dragId={drag.targetId}
          events={events}
          positioned={positioned}
          onWeekMouseDown={onWeekMouseDown}
          onEventMouseDown={onEventMouseDown}
          showDayLabels={showDayLabels}
          showMoreEvents={() => {}}
          theme={theme}
          overflow={overflow}
        />
      </div>
    );
    /* eslint-enable react/jsx-no-bind */
  }
}

Week.propTypes = propTypes;
export default CSSModules(Week, styles, {allowMultiple: true});

