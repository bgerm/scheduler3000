import React, { PropTypes } from 'react';
import Week from 'components/Scheduler/AllDay/Week';
import styles from './index.scss';
import CSSModules from 'react-css-modules';
import { range } from 'utils/DateHelpers';
import { pick } from 'lodash';
import elementResizeEvent from 'element-resize-event';
import { DRAG_TYPES } from 'redux/modules/scheduler/drag';
import classNames from 'classNames';

const propTypes = {
  period: PropTypes.object.isRequired,
  drag: PropTypes.object.isRequired,
  positioned: PropTypes.object,
  events: PropTypes.object.isRequired,
  updateAllDayGrid: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired,
  newMouseDown: PropTypes.func.isRequired,
  editMouseDown: PropTypes.func.isRequired,
  overflow: PropTypes.bool.isRequired,
  showDayLabels: PropTypes.bool.isRequired
};

class AllDay extends React.Component {
  constructor(props) {
    super(props);

    this.updateRect = this.updateRect.bind(this);
    this.trackGridRect = this.trackGridRect.bind(this);
    this.positioned = this.positionEvents(this.props.events);
  }

  componentDidMount() {
    // TODO throttle trackGridRect (not initial mount)
    setTimeout(() => {
      window.requestAnimationFrame(this.trackGridRect);
    }, 0);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.updateRect);
  }

  componentWillUpdate(nextProps) {
    const shouldUpdatePosition = !(
      nextProps.period === this.props.period &&
      nextProps.events === this.props.events
    );

    if (shouldUpdatePosition) {
      this.positioned = this.positionEvents(nextProps.events);
    }
  }

  positionEvents(events) {
    return events;
  }

  updateRect() {
    const element = this.refs.weeks;
    const gridRect = this.getGridCoordinates(element);
    this.props.updateAllDayGrid(gridRect);
  }

  trackGridRect() {
    const weekNode = this.refs.weeks;

    this.updateRect();
    elementResizeEvent(weekNode, this.updateRect);
    window.addEventListener('scroll', this.updateRect);
  }

  getGridCoordinates(element) {
    const boundingRect = element.getBoundingClientRect();

    return pick(boundingRect, ['bottom', 'height', 'left', 'right', 'top', 'width']);
  }

  render() {
    const { showDayLabels, overflow, newMouseDown, editMouseDown,
            period, drag, events, positioned, theme } = this.props;

    const startDate = period.get('startDate');
    const endDate = period.get('endDate');

    const weekStarts = range(startDate, endDate, 1, 'week');
    const weekCount = weekStarts.length;

    const weeks = weekStarts.map((weekStart, idx) => {
      return (
        <Week
          period={period}
          drag={drag}
          height={`calc(100% * 1 / ${weekCount})`}
          startDate={weekStart}
          endDate={weekStart.clone().add(6, 'days').endOf('day')}
          onWeekMouseDown={newMouseDown}
          onEventMouseDown={editMouseDown}
          overflow={overflow}
          showDayLabels={showDayLabels}
          events={events}
          positioned={positioned.get(weekStart.format('YYYYMMDD'))}
          key={'week-' + idx}
          theme={theme}
        />
      );
    });

    // drag handle
    const dragTargetEvent = events.get(drag.targetId, null);

    const draggerStyleNames = classNames(
      'dragger',
      {'hidden': drag.dragType !== DRAG_TYPES.edit}
    );

    const handle = (
      <div
        styleName={draggerStyleNames}
        style={{
          width: `${drag.width}px`,
          height: `${drag.height}px`,
          lineHeight: `${drag.height}px`,
          transform: `translate(${drag.mouseDelta.x}px, ${drag.mouseDelta.y}px)`,
          top: `${drag.originPosition.top}px`,
          left: `${drag.originPosition.left}px`
        }}
      >
        {dragTargetEvent ? dragTargetEvent.get('title') : 'Event'}
      </div>
    );

    // Absolute position weeks b/c sometimes things load
    // in the wrong order and element-resize-events screws up
    return (
      <div styleName='weeks' ref='weeks' style={{position: 'absolute'}}>
        {weeks}
        {handle}
      </div>
    );
  }
}

AllDay.propTypes = propTypes;
export default CSSModules(AllDay, styles, {allowMultiple: true});
