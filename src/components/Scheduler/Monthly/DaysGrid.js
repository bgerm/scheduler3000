import React, { PropTypes } from 'react';
import styles from './DaysGrid.scss';
import CSSModules from 'react-css-modules';
import classNames from 'classNames';
import { range } from 'utils/DateHelpers';
import { DRAG_TYPES } from 'redux/modules/scheduler/drag';
import isBetween from 'utils/DateHelpers/isBetween';

const propTypes = {
  period: PropTypes.object.isRequired,
  drag: PropTypes.object.isRequired,
  dragTargetEvent: PropTypes.object,
  enterCell: PropTypes.func.isRequired,
  newMouseDown: PropTypes.func.isRequired,
  updateRects: PropTypes.func.isRequired
};

class DaysGrid extends React.Component {
  constructor(props) {
    super(props);

    this.handleResize = this.handleResize.bind(this);
  }

  componentDidMount() {
    this.handleResize();

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('scroll', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleResize);
  }

  handleResize() {
    // update redux w/ sizer dimensions
    setTimeout(() => {
      const grid = this.refs.gridContainer.getBoundingClientRect();
      const normalSizer = this.refs.draggerSizerNormal.getBoundingClientRect();
      const wideSizer = this.refs.draggerSizerWide.getBoundingClientRect();

      this.props.updateRects({grid, normalSizer, wideSizer});
    }, 0);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(nextProps.period === this.props.period &&
      nextProps.drag === this.props.drag);
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
    const { period, drag, enterCell, dragTargetEvent, newMouseDown } = this.props;

    const startDate = period.get('startDate');
    const endDate = period.get('endDate');
    const today = period.get('today');

    const dates = range(startDate, endDate);

    const days = dates.map((x) => {
      const isToday = today.isSame(x, 'day');

      const styleNames = classNames(
        'cell',
        {'today': isToday},
        {[this.dragStyleName()]: this.shouldHighlightDay(x)}
      );

      /* eslint-disable react/jsx-no-bind */
      return (
        <div
          styleName={styleNames}
          key={x.valueOf()}
          onMouseMove={(e) => enterCell(e, x)}
          onMouseDown={(e) => e.button === 0 && newMouseDown(e, x)}
        ></div>
      );
      /* eslint-enable react/jsx-no-bind */
    });

    const draggerStyleNames = classNames(
      'dragger',
      {'wide': drag.isWide},
      {'hidden': drag.dragType !== DRAG_TYPES.edit}
    );

    const handle = (
      <div
        styleName={draggerStyleNames}
        style={{
          transform: `translate(${drag.mouseDelta.x}px, ${drag.mouseDelta.y}px)`,
          top: `${drag.originPosition.top}px`,
          left: `${drag.originPosition.left}px`
        }}
      >
        {dragTargetEvent ? dragTargetEvent.title : 'Event'}
      </div>
    );

    return (
      <div styleName='grid' ref='gridContainer'>
        {days}
        {handle}
        <div styleName='dragger-sizer' ref='draggerSizerNormal'></div>
        <div styleName='dragger-sizer wide' ref='draggerSizerWide'></div>
      </div>
    );
  }
}

DaysGrid.propTypes = propTypes;

export default CSSModules(DaysGrid, styles, { allowMultiple: true });
