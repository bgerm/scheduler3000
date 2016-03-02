import { Observable } from 'rx';
import { changePeriod } from 'redux/modules/scheduler/period';
import { DRAG_TYPES } from 'redux/modules/scheduler/drag';
import { memoize } from 'lodash';
import { fetchEvents, insertEvent, updateEvent, deleteEvent } from 'services/api';
import * as EventsActions from 'redux/modules/scheduler/events';
import * as NotificationActions from 'redux/modules/scheduler/notification';
import * as DragActions from 'redux/modules/scheduler/drag';
import * as PeriodActions from 'redux/modules/scheduler/period';
import positionMonthsEvents from 'components/Scheduler/Monthly/positionMonthsEvents';

const actionPredicate = (actions) =>
  (filterable) => actions.some((action) => (action) === filterable.action.type);

// -------------
// Change Period
// -------------

const ROUTER_CHANGE = '@@router/LOCATION_CHANGE';

const changePeriodOnPathChange = (iterable) => iterable
  .filter(actionPredicate([ROUTER_CHANGE]))
  .map((value) => value.action)
  .map((routeChange) => routeChange.payload.pathname)
  .filter((path) => path.indexOf('/scheduler') >= 0)
  .map((path) => path.split('/')[2])
  .filter((period) => period)
  .map((period) => changePeriod(period));

// ---------------------------
// Fetch data on period change
// ---------------------------

const fetchData = (iterable) => {
  const dataChangedStream = iterable
    .filter(actionPredicate(Object.values(PeriodActions.actionTypes)))
    .map(({action, store}) => store.scheduler.period)
    .distinctUntilChanged()
    .debounce(250);

  const fetchStream = dataChangedStream.flatMap((period) => {
    const startDate = period.get('startDate');
    const endDate = period.get('endDate');
    const timezone = period.get('timezone');

    return Observable
      .fromPromise(fetchEvents({startDate, endDate, timezone}))
      .map((data) => {
        const { response, error } = data;
        if (response) {
          const events = response.entities.events;
          const result = response.result.events;

          return EventsActions.loadEventsSuccess(events, result);
        } else {
          return EventsActions.loadEventsFailure(error);
        }
      });
  });

  const isLoadingStream = dataChangedStream
    .map((x) => true)
    .merge(fetchStream.map((x) => false))
    .distinctUntilChanged()
    .filter((x) => x)
    .map((x) => EventsActions.pushFetching());

  return fetchStream.merge(isLoadingStream);
};

// ---------------
// Position Events
// ---------------

const positionTriggers = [
  EventsActions.actionTypes.LOAD_EVENTS_SUCCESS,
  EventsActions.actionTypes.DELETE_EVENT,
  EventsActions.actionTypes.INSERT_EVENT,
  EventsActions.actionTypes.UPDATE_EVENT,
  EventsActions.actionTypes.UPDATE_SHOW_LIMIT,
  EventsActions.actionTypes.INSERT_EVENT_SUCCESS,
  EventsActions.actionTypes.UPDATE_EVENT_SUCCESS,
  EventsActions.actionTypes.DELETE_EVENT_SUCCESS
];

const positionEvents = (iterable) => iterable
  .filter(actionPredicate(positionTriggers))
  .map((value) => positionMonthsEvents(value.store.scheduler))
  .map((positioned) => EventsActions.updatePositioned(positioned));

// ------------------------
// Modify Events In Backend
// ------------------------

const insertEventInBackend = (iterable) => iterable
  .filter(actionPredicate([EventsActions.actionTypes.INSERT_EVENT]))
  .flatMap(({action, store}) => {
    const timezone = store.scheduler.period.get('timezone');

    return Observable.fromPromise(insertEvent(action.evnt, timezone))
      .map((result) => {
        if (result.error) {
          return EventsActions.insertEventFailure(result.error, action.evnt.id);
        } else {
          return EventsActions.insertEventSuccess(result.response.event, action.evnt.id);
        }
      });
  });

const updateEventInBackend = (iterable) => iterable
  .filter(actionPredicate([EventsActions.actionTypes.UPDATE_EVENT]))
  .flatMap(({action, store}) => {
    const timezone = store.scheduler.period.get('timezone');

    return Observable.fromPromise(updateEvent(action.evnt, timezone))
      .map((result) => {
        if (result.error) {
          return EventsActions.updateEventFailure(result.error, action.evnt.id);
        } else {
          return EventsActions.updateEventSuccess(result.response);
        }
      });
  });

const deleteEventInBackend = (iterable) => iterable
  .filter(actionPredicate([EventsActions.actionTypes.DELETE_EVENT]))
  .flatMap(({action, store}) => {
    return Observable.fromPromise(deleteEvent(action.id))
      .map((result) => {
        if (result.error) {
          return EventsActions.deleteEventFailure(result.error, action.id);
        } else {
          return EventsActions.deleteEventSuccess(result.response.id);
        }
      });
  });

// --------------------
// Modfiy Notifications
// --------------------

const notifications = (iterable) => {
  const insertSuccess = iterable
    .filter(actionPredicate([EventsActions.actionTypes.INSERT_EVENT_SUCCESS]))
    .map(({action, store}) => {
      return NotificationActions.setNotification(`Added event: ${action.evnt.title}`);
    });

  const insertFailure = iterable
    .filter(actionPredicate([EventsActions.actionTypes.INSERT_EVENT_FAILURE]))
    .map(({action, store}) => {
      return NotificationActions.setNotification(`Error adding ${action.evnt.title}`);
    });

  const updateSuccess = iterable
    .filter(actionPredicate([EventsActions.actionTypes.UPDATE_EVENT_SUCCESS]))
    .map(({action, store}) => {
      return NotificationActions.setNotification(`Updated event: ${action.evnt.title}`);
    });

  const updateFailure = iterable
    .filter(actionPredicate([EventsActions.actionTypes.UPDATE_EVENT_FAILURE]))
    .map(({action, store}) => {
      const evnt = store.scheduler.events.events[action.id];
      return NotificationActions.setNotification(`Error updating ${evnt.title}`);
    });

  const deleteSuccess = iterable
    .filter(actionPredicate([EventsActions.actionTypes.DELETE_EVENT_SUCCESS]))
    .map(({action, store}) => {
      const evnt = store.scheduler.events.events[action.id];
      return NotificationActions.setNotification(`Deleted event: ${evnt.title}`);
    });

  const deleteFailure = iterable
    .filter(actionPredicate([EventsActions.actionTypes.DELETE_EVENT_FAILURE]))
    .map(({action, store}) => {
      const evnt = store.scheduler.events.events[action.id];
      return NotificationActions.setNotification(`Error deleting ${evnt.title}`);
    });

  return Observable.merge(
    insertSuccess,
    insertFailure,
    updateSuccess,
    updateFailure,
    deleteSuccess,
    deleteFailure
  );
};

// System for hiding notifications:  start refreshes
// cancel timer and cancel yields cancel and terminates
// the timer<button>Click me</button>
const hideNotification = (iterable) => {
  const startNotifyStream = iterable
    .filter(actionPredicate([NotificationActions.actionTypes.SET_NOTIFICATION]));

  const cancelNotifyStream = iterable
    .filter(actionPredicate([NotificationActions.actionTypes.CANCEL_NOTIFICATION]));

  return Observable.amb(cancelNotifyStream, startNotifyStream.debounce(3000))
    .map((x) => NotificationActions.clearNotification())
    .take(1)
    .repeat();
};

// ----------
// Mouse Drag
// ----------

const dragger = (iterable) => {
  const { UPDATE_RECTS, CANCEL_DRAG, ENTER_CELL, NEW_MOUSE_DOWN, EDIT_MOUSE_DOWN } = DragActions.actionTypes;

  const documentMouseUp = Observable.fromEvent(document, 'mouseup');
  const documentMouseDown = Observable.fromEvent(document, 'mousedown');

  const cancelDragStream = iterable
    .filter(actionPredicate([CANCEL_DRAG]))
    .map((x) => x.action);

  const enterCellStream = iterable
    .filter(actionPredicate([ENTER_CELL]))
    .map((x) => x.action);

  const updateRectsStream = iterable
    .filter(actionPredicate([UPDATE_RECTS]))
    .map((x) => x.store.scheduler.drag.rects);

  const newMouseDownStream = iterable
    .filter(actionPredicate([NEW_MOUSE_DOWN]))
    .map((x) => x.action);

  const editMouseDown = iterable
    .filter(actionPredicate([EDIT_MOUSE_DOWN]));

  const endDragStream = documentMouseUp
    .merge(cancelDragStream);

  // Helpers
  const point = (x, y) => ({x, y});
  const mousePoint = (mouseEvent) => point(mouseEvent.pageX, mouseEvent.pageY);

  const grabOriginPosition = (mouseEvent, pageOffset, wideRect, gridRect, isWide) => {
    if (isWide) {
      const scrollOffsetX = (document.body || document.documentElement).scrollLeft;
      const originMouse = mousePoint(mouseEvent);

      return {
        left: originMouse.x - gridRect.left - (wideRect.width / 3) - scrollOffsetX,
        top: pageOffset.top - gridRect.top
      };
    }

    return {
      left: pageOffset.left - gridRect.left,
      top: pageOffset.top - gridRect.top
    };
  };

  const mouseMovedEnough = (currentMouse, initialMouse) =>
    Math.abs(currentMouse.x - initialMouse.x) > 3 ||
    Math.abs(currentMouse.y - initialMouse.y) > 3;

  // For creating new events
  const newDragStream = newMouseDownStream
    .flatMap(({date: downDate, mouseEvent: downMouseEvent}) => {
      const cellChanges = enterCellStream
        .distinctUntilChanged((x) => x.date)
        .map(({date, mouseEvent}) => ({
          lastCell: date,
          mouse: mousePoint(mouseEvent)
        }));

      return cellChanges
        .startWith({
          initialDrag: true,
          mouse: mousePoint(downMouseEvent)
        })
        .merge(documentMouseUp.map((mouseEvent) => ({
          up: true,
          mouse: mousePoint(mouseEvent)
        })))
        .scan((lastDragInfo, current) => {
          return {
            ...current,
            dragType: DRAG_TYPES.create,
            startCell: downDate,
            lastCell: current.lastCell || lastDragInfo.lastCell || downDate,
            initialDrag: current.initialDrag === true,
            stopDrag: current.up
          };
        }, {}).takeUntil(endDragStream);
    }).takeUntil(cancelDragStream);

  // For editing events
  const editDragStream = editMouseDown.flatMap(({action, store}) => {
    const {
      mouseEvent: downMouseEvent,
      startDate: downStartDate,
      endDate: downEndDate,
      targetId,
      pageOffset: downPageOffset
    } = action;

    const rects = store.scheduler.drag.rects;

    const lengthOfEvent = downEndDate.diff(downStartDate, 'days');
    const isWide = lengthOfEvent >= 1;

    const originMouse = mousePoint(downMouseEvent);
    const originPosition = grabOriginPosition(downMouseEvent, downPageOffset, rects.wideSizer, rects.grid, isWide);

    const memoizedAddDays = memoize((date) => {
      if (!date) return null;

      return date.clone().add(lengthOfEvent, 'days');
    });

    const initialData = {
      startCell: downStartDate,
      mouse: originMouse,
      initialDrag: true,
      dragType: DRAG_TYPES.show
    };

    const cellChanges = enterCellStream.map(({mouseEvent, date}) => ({
      startCell: date,
      mouse: point(mouseEvent.pageX, mouseEvent.pageY)
    }));

    return cellChanges
      .startWith(initialData)
      .merge(documentMouseUp.map((mouseEvent) =>
        ({up: true, mouse: mousePoint(mouseEvent)})
      ))
      .combineLatest(
        updateRectsStream.startWith(rects),
        (changes, updatedRect) => ({changes, updatedRect})
      )
      .scan((lastInfo, {changes: currentChanges, updatedRect}) => {
        const inEdit = (lastInfo.dragType === DRAG_TYPES.edit ||
          (lastInfo.dragType === DRAG_TYPES.show &&
            mouseMovedEnough(currentChanges.mouse, initialData.mouse)));
        const dragType = inEdit ? DRAG_TYPES.edit : DRAG_TYPES.show;

        const sizerRect = isWide ? updatedRect.wideSizer : updatedRect.normalSizer;
        const gridRect = updatedRect.grid;

        return {
          ...currentChanges,
          dragType: dragType,
          initialDrag: currentChanges.initialDrag === true,
          isWide: isWide,
          lastCell: memoizedAddDays(lastInfo.startCell),
          originPosition: originPosition,
          startCell: currentChanges.startCell || lastInfo.startCell, // mouse up doesn't know where it is
          stopDrag: currentChanges.up,
          targetId: targetId,
          mouseDelta: point(
            Math.min(
              Math.max(currentChanges.mouse.x - originMouse.x, -originPosition.left),
              gridRect.right - sizerRect.width - originPosition.left - gridRect.left
            ),
            Math.min(
              Math.max(currentChanges.mouse.y - originMouse.y, -originPosition.top),
              gridRect.bottom - sizerRect.height - originPosition.top - gridRect.top
            )
          )
        };
      }, {}).takeUntil(endDragStream);
  }).takeUntil(cancelDragStream);

  // Map to the action
  const cancelOnRightClick = documentMouseDown
    .filter((e) => e.button !== 0)
    .map((x) => DragActions.cancelDrag());

  const updateStream = Observable.amb(newDragStream, editDragStream)
    .repeat()
    .flatMap((x) => {
      const result = [DragActions.updateDrag(x)];

      if (x.dragType === DRAG_TYPES.edit && x.stopDrag) {
        result.push(EventsActions.updateEvent({id: x.targetId, startDate: x.startCell, endDate: x.lastCell}));
        result.push(DragActions.cancelDrag());
      }

      return Observable.fromArray(result);
    });

  const resetDragStream = cancelDragStream
    .map((x) => DragActions.resetDrag());

  return Observable.merge(resetDragStream, cancelOnRightClick, updateStream);
};

// ---------
// Root saga
// ---------

export default function root(iterable) {
  return Observable.merge(
    changePeriodOnPathChange(iterable),
    fetchData(iterable),
    positionEvents(iterable),
    insertEventInBackend(iterable),
    updateEventInBackend(iterable),
    deleteEventInBackend(iterable),
    hideNotification(iterable),
    notifications(iterable),
    dragger(iterable)
  );
}
