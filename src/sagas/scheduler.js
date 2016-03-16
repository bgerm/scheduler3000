import Rx, { Observable } from 'rx';
import { changePeriod } from 'redux/modules/scheduler/period';
import { DRAG_TYPES } from 'redux/modules/scheduler/drag';
import { fetchEvents, insertEvent, updateEvent, deleteEvent } from 'services/api';
import * as EventsActions from 'redux/modules/scheduler/events';
import * as NotificationActions from 'redux/modules/scheduler/notification';
import * as DragActions from 'redux/modules/scheduler/drag';
import * as PeriodActions from 'redux/modules/scheduler/period';
import positionMonthsEvents from 'components/Scheduler/Monthly/positionMonthsEvents';
import 'utils/rxjs/add/takeWhileInclusive';
import copyTime from 'utils/DateHelpers/copyTime';

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

  // Helpers
  const point = (x, y) => ({x, y});
  const mousePoint = (mouseEvent) => point(mouseEvent.pageX, mouseEvent.pageY);

  const grabOriginPosition = (mouseEvent, pageOffset, rects, isWide) => {
    const gridRect = rects.grid;

    if (isWide) {
      const scrollOffsetX = (document.body || document.documentElement).scrollLeft;
      const originMouse = mousePoint(mouseEvent);
      const wideRect = rects.wideSizer;

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
      return Rx.Observable
        .combineLatest(
          enterCellStream
            .distinctUntilChanged((x) => x.date)
            .startWith({date: downDate, mouseEvent: downMouseEvent})
            .map(({date, mouseEvent}) => ({
              endDate: date,
              mouse: mousePoint(mouseEvent)
            })),
          documentMouseUp.startWith(null),
          cancelDragStream.startWith(null),
          (mouseMoves, mouseUp, cancel) => ({mouseMoves, mouseUp, cancel}))
        .map((x, idx) => {
          const tmpStartDate = downDate;
          const tmpEndDate = x.mouseMoves.endDate;

          const [startDate, endDate] = tmpStartDate.isAfter(tmpEndDate)
            ? [tmpEndDate, tmpStartDate]
            : [tmpStartDate, tmpEndDate];

          return {
            dragType: DRAG_TYPES.create,
            startDate: startDate,
            endDate: endDate,
            initialDrag: idx === 0,
            stopDrag: x.mouseUp !== null,
            cancel: x.cancel !== null
          };
        })
        .takeWhileInclusive((x) => !(x.cancel || x.mouseUp));
    }).takeWhile((x) => !x.cancel);

  // For editing events
  const editDragStream = editMouseDown.flatMap(({action, store}) => {
    const {
      mouseEvent: downMouseEvent,
      startDate: downStartDate,
      endDate: downEndDate,
      targetId,
      pageOffset: downPageOffset,
      allDay
    } = action;

    const lengthOfEvent = downEndDate.diff(downStartDate, 'days');
    const isWide = lengthOfEvent >= 1;

    const rects = store.scheduler.drag.rects;
    const originMouse = mousePoint(downMouseEvent);
    const originPosition = grabOriginPosition(downMouseEvent, downPageOffset, rects, isWide);

    let lastDragType = DRAG_TYPES.show;

    const cellChangeStream = enterCellStream
      .distinctUntilChanged((x) => x.date)
      .startWith({date: downStartDate})
      .map(({date}) => {
        const tmpStartDate = date;
        const tmpEndDate = tmpStartDate.clone().add(lengthOfEvent, 'days');

        return {
          startDate: allDay ? tmpStartDate : copyTime(downStartDate, tmpStartDate),
          endDate: allDay ? tmpEndDate : copyTime(downEndDate, tmpEndDate)
        };
      });

    const mouseChangeStream = enterCellStream
      .startWith({mouseEvent: downMouseEvent})
      .map(({mouseEvent}) => ({
        mouse: mousePoint(mouseEvent)
      }));

    return cellChangeStream
      .combineLatest(
        mouseChangeStream,
        updateRectsStream.startWith(rects),
        documentMouseUp.startWith(null),
        cancelDragStream.startWith(null),
        (cellChanges, mouseChanges, updatedRect, mouseUp, cancel) =>
          ({cellChanges, mouseChanges, updatedRect, mouseUp, cancel})
      )
      .map(({cellChanges, mouseChanges, updatedRect, mouseUp, cancel}, idx) => {
        const inEdit = (lastDragType === DRAG_TYPES.edit ||
          (lastDragType === DRAG_TYPES.show &&
            mouseMovedEnough(mouseChanges.mouse, originMouse)));

        if (inEdit && lastDragType !== DRAG_TYPES.edit) {
          lastDragType = DRAG_TYPES.edit;
        }

        const sizerRect = isWide ? updatedRect.wideSizer : updatedRect.normalSizer;
        const gridRect = updatedRect.grid;

        return {
          mouse: mouseChanges.mouse,
          dragType: inEdit ? DRAG_TYPES.edit : DRAG_TYPES.show,
          initialDrag: idx === 0,
          isWide: isWide,
          originPosition: originPosition,
          startDate: cellChanges.startDate,
          endDate: cellChanges.endDate,
          stopDrag: mouseUp !== null,
          cancel: cancel !== null,
          targetId: targetId,
          allDay: allDay,
          mouseDelta: point(
            Math.min(
              Math.max(mouseChanges.mouse.x - originMouse.x, -originPosition.left),
              gridRect.right - sizerRect.width - originPosition.left - gridRect.left
            ),
            Math.min(
              Math.max(mouseChanges.mouse.y - originMouse.y, -originPosition.top),
              gridRect.bottom - sizerRect.height - originPosition.top - gridRect.top
            )
          )
        };
      }).takeWhileInclusive((x) => !(x.cancel || x.mouseUp));
  }).takeWhile((x) => !x.cancel);

  // Map to the action
  const cancelOnRightClick = documentMouseDown
    .filter((e) => e.button !== 0)
    .map((x) => DragActions.cancelDrag());

  const updateStream = Observable.amb(newDragStream, editDragStream)
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
