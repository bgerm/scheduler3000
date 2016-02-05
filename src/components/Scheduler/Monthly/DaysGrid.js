import { PropTypes } from 'react';
import styles from './DaysGrid.scss';
import CSSModules from 'react-css-modules';
import classNames from 'classNames';
import { range } from 'utils/DateHelpers';
import Rx from 'rx';
import { FuncSubject } from 'rx-react';
import { memoize } from 'lodash';
import { DRAG_TYPES } from 'redux/modules/scheduler/drag';

const propTypes = {
  period: PropTypes.object.isRequired,
  editStream: PropTypes.func.isRequired,
  cancelDragStream: PropTypes.func.isRequired,
  updateDrag: PropTypes.func.isRequired,
  resetDrag: PropTypes.func.isRequired,
  drag: PropTypes.object.isRequired,
  updateEvent: PropTypes.func.isRequired,
  dragTargetEvent: PropTypes.object
};

class DaysGrid extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.documentMouseUp = Rx.Observable.fromEvent(document, 'mouseup');
    this.documentMouseDown = Rx.Observable.fromEvent(document, 'mousedown');

    this.enterCell = FuncSubject.create(
      (event, date) => ({ evnt: event, date: date })
    );

    this.cellMouseDown = FuncSubject.create(
      (event, date) => ({ evnt: event, date: date })
    );

    this.cancelOnRightClick = this.documentMouseDown
      .filter(e => e.button !== 0)
      .subscribe(event => {
        this.props.cancelDragStream();
      });

    this.endDrag = this.documentMouseUp.merge(this.props.cancelDragStream);

    this.setupNewDragger();
  }

  componentWillUnmount() {
    this.cancelOnRightClick.dispose();
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !(nextProps.period === this.props.period &&
      nextProps.drag === this.props.drag);
  }

  // TODO change evnt to mouseEvent
  editDraggerStream() {
    const { editStream } = this.props;

    const point = (x, y) => ({x, y});

    const grabOriginPosition = (selectedEvt, gridRect, isWide) => {
      const wideRect = this.draggerSizerWide.getBoundingClientRect();
      const originMouse = point(selectedEvt.evnt.pageX, selectedEvt.evnt.pageY);

      let originPosition = {
        left: selectedEvt.pageOffset.left - gridRect.left,
        top: selectedEvt.pageOffset.top - gridRect.top
      };

      if (isWide) {
        const wideWidth = wideRect.width;
        const scrollOffsetX = document.body.scrollLeft || document.documentElement.scrollLeft;

        originPosition = {
          left: originMouse.x - gridRect.left - (wideWidth / 3) - scrollOffsetX,
          top: selectedEvt.pageOffset.top - gridRect.top
        };
      }

      return originPosition;
    };

    const mouseMovedEnough = (currentMouse, initialMouse) =>
      Math.abs(currentMouse.x - initialMouse.x) > 3 ||
      Math.abs(currentMouse.y - initialMouse.y) > 3;

    return editStream.flatMap((selectedEvt) => {
      const lengthOfEvent = selectedEvt.endDate.diff(selectedEvt.startDate, 'days');
      const isWide = lengthOfEvent > 1;

      const gridRect = this.gridContainer.getBoundingClientRect();
      const sizerRect = (isWide ? this.draggerSizerWide : this.draggerSizer).getBoundingClientRect();

      const originMouse = point(selectedEvt.evnt.pageX, selectedEvt.evnt.pageY);
      const originPosition = grabOriginPosition(selectedEvt, gridRect, isWide);

      const memoizedAddDays = memoize((date) => {
        if (!date) return null;

        return date.clone().add(lengthOfEvent, 'days');
      });

      const initialData = {
        startCell: selectedEvt.startDate,
        mouse: point(selectedEvt.evnt.pageX, selectedEvt.evnt.pageY),
        initialDrag: true,
        dragType: DRAG_TYPES.show
      };

      const cellChanges = this.enterCell.map((ec) => ({
        startCell: ec.date,
        mouse: point(ec.evnt.pageX, ec.evnt.pageY)
      }));

      return cellChanges
        .startWith(initialData)
        .merge(this.documentMouseUp.map(
          e => ({up: true, mouse: point(e.pageX, e.pageY)}))
        )
        .scan((x, y) => {
          const inEdit = (x.dragType === DRAG_TYPES.edit ||
            (x.dragType === DRAG_TYPES.show && mouseMovedEnough(y.mouse, initialData.mouse)));
          const dragType = inEdit ? DRAG_TYPES.edit : DRAG_TYPES.show;

          const result = {
            ...y,
            dragType: dragType,
            lastCell: memoizedAddDays(x.startCell),
            isWide: isWide,
            targetId: selectedEvt.id,
            originPosition: originPosition,
            initialDrag: y.initialDrag === true,
            stopDrag: false,
            startCell: y.startCell || x.startCell // mouse up doesn't know where it is
          };

          if (y.up) {
            return {
              ...result,
              stopDrag: true
            };
          } else {
            return {
              ...result,
              mouseDelta: point(
                Math.min(
                  Math.max(y.mouse.x - originMouse.x, -originPosition.left),
                  gridRect.right - sizerRect.width - originPosition.left - gridRect.left
                ),
                Math.min(
                  Math.max(y.mouse.y - originMouse.y, -originPosition.top),
                  gridRect.bottom - sizerRect.height - originPosition.top - gridRect.top
                )
              )
            };
          }
        }, {}).takeUntil(this.endDrag);
    }).takeUntil(this.props.cancelDragStream);
  }

  newDraggerStream() {
    return this.cellMouseDown.flatMap((md) => {
      const initialData = {
        mouse: {x: md.evnt.pageX, y: md.evnt.pageY},
        initialDrag: true
      };

      const cellChanges = this.enterCell.distinctUntilChanged(x => x.date)
        .map((ec) => {
          return {
            lastCell: ec.date,
            mouse: {x: ec.evnt.pageX, y: ec.evnt.pageY}
          };
        });

      return cellChanges
        .startWith(initialData)
        .merge(this.documentMouseUp.map(
          e => ({up: true, mouse: {x: e.clientX, y: e.clientY}}))
        )
        .scan((x, y) => {
          const result = {
            ...y,
            dragType: DRAG_TYPES.create,
            startCell: md.date,
            lastCell: y.lastCell || x.lastCell || md.date,
            initialDrag: y.initialDrag === true
          };

          if (y.up) {
            return { ...result, stopDrag: true };
          } else {
            return { ...result, stopDrag: false };
          }
        }, {}).takeUntil(this.endDrag);
    }).takeUntil(this.props.cancelDragStream);
  }

  setupNewDragger() {
    const { updateEvent, updateDrag, resetDrag } = this.props;

    Rx.Observable.amb(this.newDraggerStream(), this.editDraggerStream())
      .repeat()
      .subscribe(function updateDragSubscriber(x) {
        updateDrag(x);

        if (x.dragType === DRAG_TYPES.edit && x.stopDrag) {
          updateEvent({id: x.targetId, startDate: x.startCell, endDate: x.lastCell});
          // TODO can we put somewhere else?
          this.props.cancelDragStream();
        }
      }.bind(this));

    this.props.cancelDragStream.subscribe(function cancelDragSubscriber() {
      resetDrag();
    });
  }

  shouldHighlightDay(date) {
    const { startCell, lastCell } = this.props.drag;

    if (!startCell || !lastCell) return false;

    return ((startCell <= lastCell && date >= startCell && date <= lastCell) ||
            (startCell > lastCell && date <= startCell && date >= lastCell));
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
    const { period, drag, dragTargetEvent } = this.props;

    const startDate = period.get('startDate');
    const endDate = period.get('endDate');
    const today = period.get('today');

    const dates = range(startDate, endDate);

    const days = dates.map(x => {
      const isToday = today.isSame(x, 'day');

      const styleNames = classNames(
        'cell',
        {'today': isToday},
        {[this.dragStyleName()]: this.shouldHighlightDay(x)}
      );

      return (
        <div
          styleName={styleNames}
          key={x.valueOf()}
          onMouseMove={e => this.enterCell(e, x)}
          onMouseDown={e => e.button === 0 && this.cellMouseDown(e, x)}
        ></div>
      );
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
        ref={(c) => this.handleContainer = c}>
        {dragTargetEvent ? dragTargetEvent.title : 'Event'}
      </div>
    );

    return (
      <div styleName='grid' ref={(c) => this.gridContainer = c}>
        { days }
        { handle }
        <div styleName='dragger-sizer' ref={(c) => this.draggerSizer = c}></div>
        <div styleName='dragger-sizer wide' ref={(c) => this.draggerSizerWide = c}></div>
      </div>
    );
  }
}

DaysGrid.propTypes = propTypes;

export default CSSModules(DaysGrid, styles, { allowMultiple: true });
