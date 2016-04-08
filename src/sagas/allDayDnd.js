// All Day Drag-n-Drop for selecting days and dragging events

import { Observable, BehaviorSubject } from 'rxjs';
import { DRAG_TYPES } from 'redux/modules/scheduler/drag';
import * as EventsActions from 'redux/modules/scheduler/events';
import * as DragActions from 'redux/modules/scheduler/drag';
import * as AllDayLayoutActions from 'redux/modules/scheduler/allDayLayout';
import * as PeriodActions from 'redux/modules/scheduler/period';
import 'utils/rxjs/add/takeWhileInclusive';
import 'utils/rxjs/add/log';
import copyTime from 'utils/DateHelpers/copyTime';
import { range } from 'utils/DateHelpers';
import actionPredicate from './utils/actionPredicate';
import themes from 'components/Scheduler/themes';

const { CANCEL_DRAG, NEW_MOUSE_DOWN, EDIT_MOUSE_DOWN } = DragActions.actionTypes;
const { UPDATE_GRID } = AllDayLayoutActions.actionTypes;

// Helpers
function point(x, y) {
  return {x, y};
}

function mousePoint(mouseEvent) {
  return point(mouseEvent.clientX, mouseEvent.clientY);
}

function mouseMovedEnough(currentMouse, initialMouse) {
  return Math.abs(currentMouse.x - initialMouse.x) > 3 ||
    Math.abs(currentMouse.y - initialMouse.y) > 3;
}

function orderDates(date1, date2) {
  return date1.isAfter(date2)
    ? [date2, date1]
    : [date1, date2];
}

function bound(position, min, max) {
  return Math.min(Math.max(min, position), max);
}

function isLeftMouseButton(mouseEvent) {
  return mouseEvent.button === 0;
}

function calcCellWidth(grid, scrollBarWidth, columnCount) {
  return (grid.get('width') - scrollBarWidth) / columnCount;
}

function calcSizerWidth(cellWidth, isWide, theme) {
  const totalEventBlockPadding = theme.eventBlockWrapper.paddingLeft + theme.eventBlockWrapper.paddingRight + 1;
  return isWide
    ? (cellWidth * 1.25) - totalEventBlockPadding
    : cellWidth - totalEventBlockPadding;
}

// Can't think of a better name for this
function alwaysTrueOnceTrue(fn, ctx = null) {
  let seen = false;

  return function() {
    seen = seen || fn.apply(ctx, arguments);
    return seen;
  };
}

// Stream Creators
function createCancelDrag$(iterable) {
  return iterable
    .filter(actionPredicate([CANCEL_DRAG]))
    .map((x) => x.action);
}

function createNewMouseDown$(iterable) {
  return iterable
    .filter(actionPredicate([NEW_MOUSE_DOWN]))
    .map((x) => x.action);
}

function createEditMouseDown$(iterable) {
  return iterable
    .filter(actionPredicate([EDIT_MOUSE_DOWN]));
}

function createUserSettings$(iterable) {
  return iterable
    .map((x) => x.store.scheduler.userSettings)
    .distinctUntilChanged();
}

function createPeriod$(iterable) {
  return iterable
    .filter(actionPredicate(Object.values(PeriodActions.actionTypes))) // this ignores SET_TODAY
    .map(({action, store}) => store.scheduler.period)
    .distinctUntilChanged();
}

function createAllDayRect$(iterable) {
  return iterable
    .filter(actionPredicate([UPDATE_GRID]))
    .map((x) => x.action.grid)
    .distinctUntilChanged();
}

function createGrid$(iterable, period$, allDayRect$) {
  return Observable.combineLatest(
    period$,
    allDayRect$,
    (period, allDayRect) => ({period, allDayRect}))
  .filter((x) => x.allDayRect)
  .map(({period, allDayRect}) => {
    const rowCount = period.get('endDate').diff(period.get('startDate'), 'weeks') + 1;
    const columnCount = 7; // TODO base on period, which is always 7 for now

    const gridToDateMap = range(period.get('startDate'), period.get('endDate'), 1, 'day');

    return {
      mouseToDate: function(mouse, scrollbarWidth, bounded = false) {
        const borders = 6;

        const relativeMouse = {
          x: mouse.x - allDayRect.get('left'),
          y: mouse.y - allDayRect.get('top')
        };

        const cellWidth = calcCellWidth(allDayRect, scrollbarWidth, columnCount);
        const cellHeight = (allDayRect.get('height') - borders) / rowCount;

        let column = Math.floor(relativeMouse.x / cellWidth);
        let row = Math.floor(relativeMouse.y / cellHeight);

        if (bounded) {
          column = Math.min(Math.max(column, 0), columnCount - 1);
          row = Math.min(Math.max(row, 0), rowCount - 1);
        } else if (column < 0 || row < 0 || column > columnCount - 1 || row > rowCount - 1) {
          return null;
        }

        return gridToDateMap[row * columnCount + column] || null;
      },
      rect: allDayRect
    };
  });
}

// All Day Drag-n-Drop Observable
export default function allDayDnd(iterable) {
  const documentMouseUp$ = Observable.fromEvent(document, 'mouseup');
  const documentMouseDown$ = Observable.fromEvent(document, 'mousedown');
  const documentMouseMove$ = Observable.fromEvent(document, 'mousemove');

  const period$ = createPeriod$(iterable);
  const userSettings$ = createUserSettings$(iterable);
  const allDayRect$ = createAllDayRect$(iterable);
  const grid$ = createGrid$(iterable, period$, allDayRect$);

  const gridBehavior = new BehaviorSubject(null);
  grid$.subscribe(gridBehavior);

  const userSettingsBehavior = new BehaviorSubject(null);
  userSettings$.subscribe(userSettingsBehavior);

  const cancelDrag$ = createCancelDrag$(iterable);
  const newMouseDown$ = createNewMouseDown$(iterable);
  const editMouseDown$ = createEditMouseDown$(iterable);

  // Set up observable for creating new calendar events
  const newDrag$ = newMouseDown$
    // only take mouse downs via left mouse button
    .filter((newMouse) => isLeftMouseButton(newMouse.mouseEvent))
    // make sure we have a grid before we allow mouse down
    .withLatestFrom(gridBehavior, (newMouse, grid) => ({newMouse, grid}))
    .filter(({grid, newMouse}) => grid)
    // now flatMap on the down event
    .flatMap(({grid, newMouse: {mouseEvent: downMouseEvent, scrollbarWidth}}) => {
      // Here we use withLatestFrom so it doesn't suprise the user, as
      // combineLatest will automatically change the selected dates when the grid
      // dimensions change.
      const mouseOverCell$ = documentMouseMove$
        .startWith(downMouseEvent)
        .withLatestFrom(gridBehavior, (mouseEvent, grid) => ({mouseEvent, grid}))
        .map(({mouseEvent, grid}, idx) => {
          return grid.mouseToDate(mousePoint(mouseEvent), scrollbarWidth, idx !== 0);
        });

      let downCell;

      // Record mouseup and cancel events, which will complete the stream.
      // If mouseup then stopDrag will also be sent with the data in the onNext
      return Observable
        .combineLatest(
          mouseOverCell$.takeUntil(documentMouseUp$),
          documentMouseUp$.startWith(null),
          cancelDrag$.startWith(null),
          (mouseOverCell, mouseUp, cancel) => ({mouseOverCell, mouseUp, cancel}))
        .map(({mouseOverCell, mouseUp, cancel}, idx) => {
          if (mouseOverCell === null) return { cancel: true };

          if (!downCell) downCell = mouseOverCell;

          const [startDate, endDate] = orderDates(downCell, mouseOverCell);

          return {
            dragType: DRAG_TYPES.create,
            startDate: startDate,
            endDate: endDate,
            initialDrag: idx === 0,
            stopDrag: mouseUp !== null,
            cancel: cancel !== null
          };
        })
        .takeWhileInclusive((x) => !(x.cancel || x.mouseUp));
    }).takeWhile((x) => !x.cancel);

  // Set up observable for dragging existing calendar events
  const editDrag$ = editMouseDown$
    .map((x) => x.action)
    // only take mouse downs via left mouse button
    .filter((editMouse) => isLeftMouseButton(editMouse.mouseEvent))
    // make sure we have a grid before we allow mouse down
    .withLatestFrom(gridBehavior, userSettingsBehavior,
      (editMouse, grid, userSettings) => ({editMouse, grid, userSettings}))
    .filter(({grid, editMouse}) => grid)
    // now flatMap on the down event
    .flatMap(({userSettings, grid, editMouse: {mouseEvent: downMouseEvent, calendarEvent, scrollbarWidth}}) => {
      const allDay = calendarEvent.get('allDay');
      const eventStart = calendarEvent.get('startDate');
      const eventEnd = calendarEvent.get('endDate');
      const targetId = calendarEvent.get('id');

      const lengthOfEvent = eventEnd.diff(eventStart, 'days');
      const isWide = lengthOfEvent >= 1;

      const originMouse = mousePoint(downMouseEvent);

      const targetRect = downMouseEvent.target.getBoundingClientRect();

      const theme = themes[userSettings.get('theme', 'default')].allDay;
      const eventHeight = theme.eventRow.height;

      const cellWidth = calcCellWidth(grid.rect, scrollbarWidth, 7);
      const sizerWidth = calcSizerWidth(cellWidth, isWide, theme);

      // set offset to be distance of mouse to target left position
      // if wide and the offset is greater than third the cell width
      // change the offset to be 1/3 of the size of the event handler
      let originXOffset = (originMouse.x - targetRect.left) / grid.rect.get('width');
      if (isWide && originXOffset * grid.rect.get('width') > cellWidth / 3) {
        originXOffset = ((sizerWidth) / 3) / grid.rect.get('width');
      }

      const mouseMovedEnoughMemo = alwaysTrueOnceTrue(mouseMovedEnough);

      // Here we use withLatestFrom so it doesn't suprise the user, as
      // combineLatest will automatically change the selected dates when the grid
      // dimensions change.
      const mouseOverCell$ = documentMouseMove$
        .startWith(downMouseEvent)
        .combineLatest(gridBehavior, (mouseEvent, grid) => ({mouseEvent, grid}))
        .map(({mouseEvent, grid}, idx) => {
          return grid.mouseToDate(mousePoint(mouseEvent), scrollbarWidth, idx !== 0);
        })
        .distinctUntilChanged()
        .map((overDate) => {
          if (overDate === null) return null;

          const endDate = overDate.clone().add(lengthOfEvent, 'days');

          return {
            startDate: allDay ? overDate : copyTime(eventStart, overDate),
            endDate: allDay ? endDate : copyTime(eventEnd, endDate)
          };
        });

      // Record mouseup and cancel events, which will complete the stream.
      // If mouseup then stopDrag will also be sent with the data in the onNext
      return Observable
        .combineLatest(
          gridBehavior,
          documentMouseMove$
            .startWith(downMouseEvent)
            .map(mousePoint)
            .takeUntil(documentMouseUp$),
          mouseOverCell$.takeUntil(documentMouseUp$),
          documentMouseUp$.startWith(null),
          cancelDrag$.startWith(null),
          (grid, currentMouse, mouseOverCell, mouseUp, cancel) =>
            ({grid, currentMouse, mouseOverCell, mouseUp, cancel}))
        .map(({grid, currentMouse, mouseOverCell, mouseUp, cancel}, idx) => {
          if (mouseOverCell === null) return { cancel: true };

          const dragType = mouseMovedEnoughMemo(currentMouse, originMouse)
            ? DRAG_TYPES.edit
            : DRAG_TYPES.show;

          const gridRect = grid.rect;

          const newX = currentMouse.x - gridRect.get('left') - (originXOffset * gridRect.get('width'));
          // Use of eventHeight / 2 to make handle offset halfway up event drag handle
          const newY = currentMouse.y - gridRect.get('top') - (eventHeight / 2);

          const latestCellWidth = calcCellWidth(gridRect, scrollbarWidth, 7);
          const latestSizerWidth = calcSizerWidth(latestCellWidth, isWide, theme);

          return {
            mouse: currentMouse,
            dragType: dragType,
            initialDrag: idx === 0,
            isWide: isWide,
            originPosition: {left: 0, top: 0},
            startDate: mouseOverCell.startDate,
            endDate: mouseOverCell.endDate,
            targetId: targetId,
            allDay: allDay,
            height: eventHeight,
            width: latestSizerWidth,
            mouseDelta: point(
              bound(newX, 0, gridRect.get('width') - latestSizerWidth - scrollbarWidth),
              bound(newY, 0, gridRect.get('height') - eventHeight)
            ),
            stopDrag: mouseUp !== null,
            cancel: cancel !== null
          };
        })
        .takeWhileInclusive((x) => !(x.cancel || x.mouseUp));
    }).takeWhile((x) => !x.cancel);

  // Map to the action
  const update$ = Observable.race(newDrag$, editDrag$)
    .repeat()
    .flatMap((x) => {
      const result = [DragActions.updateDrag(x)];

      if (x.dragType === DRAG_TYPES.edit && x.stopDrag) {
        result.push(EventsActions.updateEvent({
          id: x.targetId,
          startDate: x.startDate,
          endDate: x.endDate,
          allDay: x.allDay
        }));
        result.push(DragActions.cancelDrag());
      }

      return Observable.from(result);
    });

  const cancelOnRightClick$ = documentMouseDown$
    .filter((e) => e.button !== 0) // TODO merge period stream?
    .map((x) => DragActions.cancelDrag());

  const resetDrag$ = cancelDrag$
    .map((x) => DragActions.resetDrag());

  return Observable.merge(resetDrag$, cancelOnRightClick$, update$);
};
