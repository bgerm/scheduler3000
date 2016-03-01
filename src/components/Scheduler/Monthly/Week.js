import React from 'react';
import { PropTypes } from 'react';
import styles from './Week.scss';
import CSSModules from 'react-css-modules';
import classNames from 'classNames';
import { range } from 'utils/DateHelpers';
import Immutable from 'immutable';
import momentPropType from 'utils/PropTypes/momentPropType';

const propTypes = {
  startDate: momentPropType.isRequired,
  today: momentPropType.isRequired,
  dragId: PropTypes.string,
  events: PropTypes.object.isRequired,
  positioned: PropTypes.object,
  editMouseDown: PropTypes.func.isRequired,
  showMoreEvents: PropTypes.func.isRequired
};

class Week extends React.Component {
  edit(event, evnt) {
    const { editMouseDown } = this.props;
    const pageOffset = event.target.getBoundingClientRect();

    editMouseDown(event, evnt.id, evnt.startDate, evnt.endDate, pageOffset);
  }

  render() {
    const { startDate, today, dragId, events, positioned, showMoreEvents } = this.props;

    const dates = range(startDate, startDate.clone().add(6, 'days'));

    const dayLabels = dates.map((x, idx) => {
      const isToday = today.isSame(x, 'day');
      const styleNames = classNames(`start-${idx + 1}`, 'span-1', {'today': isToday});

      return (
        <div styleName={styleNames} key={`day-${idx}`}>
          {isToday ? 'Today ' : ''}{x.get('date')}
        </div>
      );
    });

    const renderEvents = (positioned || []).map((e, idx) => {
      const rows = e.map((b) => {
        const id = b.get('id');
        const start = b.get('start');
        const span = b.get('span');
        const moreLeft = b.get('moreLeft');
        const moreRight = b.get('moreRight');
        const startDate = b.get('startDate');

        if (Immutable.List.isList(id)) {
          return (
            <div styleName={`start-${start} span-${span}`} key={`${start}-more`}>
              <div styleName='event-block-wrapper more'>
                <div styleName='event-block'>
                  <div styleName=''>
                    <a onClick={(e) => showMoreEvents(e, id, startDate)}>{`${id.size} more`}</a>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        const evnt = events[id];

        const eventBlockStyles = classNames(
          'event-block',
          {'more-right': moreRight},
          {'more-left': moreLeft},
          {'disabled': dragId === id}
        );

        const eventStyles = classNames(
          'event',
          {'saving': evnt.saving}
        );

        return (
          <div styleName={`start-${start} span-${span}`} key={evnt.id}>
            <div styleName='event-block-wrapper' onMouseDown={(e) => !evnt.saving && this.edit(e, evnt)}>
              <div styleName={eventBlockStyles}>
                <div styleName={eventStyles}>
                  {evnt.title || 'No title'}
                </div>
              </div>
            </div>
          </div>
        );
      });

      return (
        <div styleName='event-row' key={`row-${idx}`}>
          {rows}
        </div>
      );
    });

    return (
      <div styleName='week'>
        <div styleName='event-row event-days'>
          {dayLabels}
        </div>
        {renderEvents}
      </div>
    );
  }
}

Week.propTypes = propTypes;

export default CSSModules(Week, styles, {allowMultiple: true});
