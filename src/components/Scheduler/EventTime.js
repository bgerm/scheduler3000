import React from 'react';
import { PropTypes } from 'react';

const DATE_FORMAT = 'ddd, MMM D';
const YEAR_FORMAT = 'ddd, MMM D, YYYY';
const TIME_FORMAT = 'ddd, MMM D, h:mm:a';
const TIME_YEAR_FORMAT = 'ddd, MMMM, D, YYYY, h:mm:a';

const propTypes = {
  event: PropTypes.object.isRequired // TODO Shape
};

export default class EventTime extends React.Component {
  formatEventTime() {
    const calendarEvent = this.props.event;

    const startDate = calendarEvent.get('startDate');
    const endDate = calendarEvent.get('endDate');
    const allDay = calendarEvent.get('allDay');

    if (allDay) {
      if (startDate.isSame(endDate, 'day')) {
        return `${startDate.format(YEAR_FORMAT)}`;
      } else if (startDate.isSame(endDate, 'year')) {
        return `${startDate.format(DATE_FORMAT)} - ${endDate.format(YEAR_FORMAT)}`;
      } else {
        return `${startDate.format(YEAR_FORMAT)} - ${endDate.format(YEAR_FORMAT)}`;
      }
    } else {
      return `${startDate.format(TIME_FORMAT)} - ${endDate.format(TIME_YEAR_FORMAT)}`;
    }
  }

  render() {
    return <span>{this.formatEventTime()}</span>;
  }
}

EventTime.propTypes = propTypes;
