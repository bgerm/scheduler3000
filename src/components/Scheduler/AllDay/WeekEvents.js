import React, { PropTypes } from 'react';
import styles from './WeekEvents.scss';
import CSSModules from 'react-css-modules';
import classNames from 'classNames';
import { range } from 'utils/DateHelpers';
import Immutable from 'immutable';
import momentPropType from 'utils/PropTypes/momentPropType';

const propTypes = {
  startDate: momentPropType.isRequired,
  endDate: momentPropType.isRequired,
  period: PropTypes.object.isRequired,
  dragId: PropTypes.string,
  events: PropTypes.object.isRequired,
  positioned: PropTypes.object,
  showMoreEvents: PropTypes.func.isRequired,
  showDayLabels: PropTypes.bool,
  theme: PropTypes.object.isRequired,
  onWeekMouseDown: PropTypes.func.isRequired,
  onEventMouseDown: PropTypes.func.isRequired,
  overflow: PropTypes.bool.isRequired
};

class WeekEvents extends React.Component {
  constructor(props) {
    super(props);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.edit = this.edit.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    return (
      nextProps.period !== this.props.period ||
      nextProps.dragId !== this.props.dragId ||
      nextProps.positioned !== this.props.positioned ||
      nextProps.startDate !== this.props.startDate ||
      nextProps.endDate !== this.props.endDate
    );
  }

  onMouseDown(event) {
    const rect = this.refs.week.getBoundingClientRect();
    const clientWidth = this.refs.week.clientWidth;
    const relativeMouseX = event.pageX - rect.left;
    const scrollbarWidth = rect.width - clientWidth;

    // Make sure we aren't clicking on a scorllbar
    if (relativeMouseX < clientWidth) {
      this.props.onWeekMouseDown(event, scrollbarWidth);
    }

    event.preventDefault();
    event.stopPropagation();
  }

  edit(mouseEvent, calendarEvent) {
    const rect = this.refs.week.getBoundingClientRect();
    const clientWidth = this.refs.week.clientWidth;
    const scrollbarWidth = rect.width - clientWidth;

    if (!calendarEvent.get('saving')) {
      this.props.onEventMouseDown(mouseEvent, calendarEvent, scrollbarWidth);
    }

    mouseEvent.preventDefault();
    mouseEvent.stopPropagation();
  }

  render() {
    const { overflow, startDate, endDate, period, dragId, events, positioned, showMoreEvents, theme } = this.props;
    const today = period.get('today');

    // TODO have this converted to a actual CSS via something
    // like react-look
    const eventRowStyles = {
      marginBottom: `${theme.eventRow.marginBottom}px`,
      marginTop: `${theme.eventRow.marginTop}px`,
      height: `${theme.eventRow.height}px`,
      lineHeight: `${theme.eventRow.lineHeight}px`
    };

    const eventBlockWrapperStyles = {
      paddingLeft: `${theme.eventBlockWrapper.paddingLeft}px`,
      paddingRight: `${theme.eventBlockWrapper.paddingRight}px`
    };

    const showDayLabels = this.props.showDayLabels === undefined || this.props.showDayLabels;

    const dates = range(startDate, endDate);

    let dayLabels = null;

    if (showDayLabels) {
      const daysLabels = dates.map((x, idx) => {
        const isToday = today.isSame(x, 'day');
        const styleNames = classNames(`start-${idx + 1}`, 'span-1', {'today': isToday});

        return (
          <div styleName={styleNames} key={`day-label-${idx}`}>
            {isToday ? 'Today ' : ''}{x.get('date')}
          </div>
        );
      });

      dayLabels = <div styleName='event-row event-days' style={eventRowStyles}>{daysLabels}</div>;
    }

    const formatTitle = (evnt) => {
      const title = evnt.get('title') || 'No title';

      return evnt.get('allDay')
        ? title
        : `${evnt.get('startDate').format('ha')} ${title}`;
    };

    const renderEvents = (positioned || []).map((e, idx) => {
      const rows = e.map((b) => {
        const id = b.get('id');
        const start = b.get('start');
        const span = b.get('span');
        const moreLeft = b.get('moreLeft');
        const moreRight = b.get('moreRight');
        const startDate = b.get('startDate');

        /* eslint-disable react/jsx-no-bind */
        if (Immutable.List.isList(id)) {
          return (
            <div styleName={`start-${start} span-${span}`} key={`${start}-more`}>
              <div styleName='event-block-wrapper more' style={eventBlockWrapperStyles}>
                <div styleName='event-block'>
                  <div styleName=''>
                    <a onClick={(e) => showMoreEvents(e, id, startDate)}>{`${id.size} more`}</a>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        /* eslint-enable react/jsx-no-bind */

        const evnt = events.get(id);

        const eventBlockStyles = classNames(
          'event-block',
          {'more-right': moreRight},
          {'more-left': moreLeft},
          {'disabled': dragId === id}
        );

        const eventStyles = classNames(
          'event',
          {'saving': evnt.get('saving')}
        );

        // eventually grab from the calendar category
        // color
        const eventBlockColors = !evnt.get('allDay') && evnt.get('startDate').isSame(evnt.get('endDate'), 'day')
          ? { backgroundColor: 'transparent', color: '#af31fe' }
          : { backgroundColor: '#af31fe', color: '#ffffff' };

        /* eslint-disable react/jsx-no-bind */
        return (
          <div styleName={`start-${start} span-${span}`} key={evnt.get('id')}>
            <div
              styleName='event-block-wrapper'
              onMouseDown={(e) => this.edit(e, evnt)}
              style={eventBlockWrapperStyles}>
              <div styleName={eventBlockStyles} style={eventBlockColors}>
                <div styleName={eventStyles}>
                  {formatTitle(evnt)}
                </div>
              </div>
            </div>
          </div>
        );
        /* eslint-enable react/jsx-no-bind */
      });

      return (
        <div styleName='event-row' key={`row-${idx}`} style={eventRowStyles}>
          {rows}
        </div>
      );
    });

    const eventsClassNames = classNames(
      'events',
      {'overflow': overflow}
    );

    return (
      <div ref='week' styleName={eventsClassNames} onMouseDown={this.onMouseDown}>
        {dayLabels}
        {renderEvents}
      </div>
    );
  }
}

WeekEvents.propTypes = propTypes;
export default CSSModules(WeekEvents, styles, {allowMultiple: true});
