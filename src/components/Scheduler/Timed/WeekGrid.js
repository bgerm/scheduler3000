import React, { PropTypes } from 'react';
import styles from './WeekGrid.scss';
import CSSModules from 'react-css-modules';
import { range } from 'lodash';
import { range as dateRange } from 'utils/DateHelpers';
import classNames from 'classNames';
import HourMarkers from './HourMarkers';

const propTypes = {
  period: PropTypes.object.isRequired
};

const cellStyles = (today, day) => {
  return classNames(
    'cell',
    {'today': day.isSame(today, 'day')}
  );
};

class WeekGrid extends React.Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.period !== this.props.period;
  }

  render() {
    const { period } = this.props;

    const startDate = period.get('startDate');
    const endDate = period.get('endDate');
    const today = period.get('today');

    // note this iteration only for seven days because of the SASS @columnCells
    // mixin
    const emptyCells = dateRange(startDate, endDate).map((day, idx) => {
      const cellStyleNames = cellStyles(today, day);

      return (
        <div styleName={cellStyleNames} key={`empty-${idx}`}>
        </div>
      );
    });

    const hours = range(0, 24).map((hour) => {
      const styleNames = classNames(
        'hour-grid',
        {'off-hour': hour < 9 || hour > 18}
      );

      const days = dateRange(startDate, endDate).map((day, dayIdx) => {
        const cellStyleNames = cellStyles(today, day);

        return (
          <div styleName={cellStyleNames} key={`hour-${hour}-${dayIdx}`}>
            <div styleName='half-hour-marker'></div>
          </div>
        );
      });

      return (
        <div key={hour} styleName={styleNames}>
          {days}
        </div>
      );
    });

    return (
      <div styleName='week-grid' className='clearfix'>
        <HourMarkers startHour={0} endHour={24} />
        <div styleName='header-grid grid-container'>
          {emptyCells}
        </div>
        <div styleName='hours-grid grid-container'>
          {hours}
        </div>
      </div>
    );
  }
}

WeekGrid.propTypes = propTypes;
export default CSSModules(WeekGrid, styles, {allowMultiple: true});
