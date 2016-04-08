import React, { PropTypes } from 'react';
import styles from './WeekGrid.scss';
import CSSModules from 'react-css-modules';
import classNames from 'classNames';
import isBetween from 'utils/DateHelpers/isBetween';
import { range } from 'utils/DateHelpers';
import { DRAG_TYPES } from 'redux/modules/scheduler/drag';
import momentPropType from 'utils/PropTypes/momentPropType';

const propTypes = {
  period: PropTypes.object.isRequired,
  drag: PropTypes.object.isRequired,
  startDate: momentPropType.isRequired,
  endDate: momentPropType.isRequired,
  overflow: PropTypes.bool.isRequired
};

class WeekGrid extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextProps.period !== this.props.period ||
      nextProps.startDate !== this.props.startDate ||
      nextProps.endDate !== this.props.endDate ||
      nextProps.drag.dragType !== this.props.drag.dragType ||
      nextProps.drag.startDate !== this.drag.startDate ||
      nextProps.drag.endDate !== this.drag.endDate
    );
  }

  shouldHighlightDay(date) {
    const { startDate, endDate } = this.props.drag;

    if (!startDate || !endDate) return false;

    return isBetween(date, startDate, endDate, 'days', '[]');
  }

  dragStyleName() {
    const { dragType } = this.props.drag;

    if (dragType === DRAG_TYPES.create) {
      return 'selected-create';
    } else if (dragType === DRAG_TYPES.edit) {
      return 'selected-edit';
    }

    return '';
  }

  render() {
    const { overflow, period, startDate, endDate } = this.props;
    const today = period.get('today');

    const weekDates = range(startDate, endDate.endOf('day'));

    const days = weekDates.map((x, idx) => {
      const isToday = today.isSame(x, 'day');

      const styleNames = classNames(
        'cell',
        {'today': isToday},
        {[this.dragStyleName()]: this.shouldHighlightDay(x)}
      );

      return (
        <div
          styleName={styleNames}
          key={'day-' + idx}
        ></div>
      );
    });

    const gridClassNames = classNames(
      'grid',
      {'overflow': overflow}
    );

    return (
      <div styleName={gridClassNames}>
        {days}
      </div>
    );
  }
}

WeekGrid.propTypes = propTypes;
export default CSSModules(WeekGrid, styles, {allowMultiple: true});

