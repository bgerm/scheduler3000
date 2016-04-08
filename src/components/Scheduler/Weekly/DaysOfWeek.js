import React, { PropTypes } from 'react';
import classNames from 'classNames';
import { range } from 'utils/DateHelpers';
import styles from './DaysOfWeek.scss';
import CSSModules from 'react-css-modules';

const propTypes = {
  period: PropTypes.object.isRequired
};

class DaysOfWeek extends React.Component {
  render() {
    const { period } = this.props;

    const startDate = period.get('startDate');
    const endDate = period.get('endDate');
    const today = period.get('today');

    const days = range(startDate, endDate);
    const daysOfWeek = days.map((day, idx) => {
      const styleNames = classNames(
        'cell',
        {'today': day.isSame(today, 'day')}
      );

      return (<div key={`dow-${idx}`} styleName={styleNames}>{day.format('ddd M/D')}</div>);
    });

    return (
      <div styleName='days-of-week'>
        {daysOfWeek}
      </div>
    );
  }
}

DaysOfWeek.propTypes = propTypes;
export default CSSModules(DaysOfWeek, styles, {allowMultiple: true});
