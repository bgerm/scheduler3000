import React from 'react';
import CSSModules from 'react-css-modules';
import styles from './DaysOfWeek.scss';

class DaysOfWeek extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // should probably move this compent somewhere else,
    // but may configure so that start of week changes
    return false;
  }

  render() {
    return (
      <div styleName='weekdays'>
        <div styleName='start-1 span-1'>Sun</div>
        <div styleName='start-2 span-1'>Mon</div>
        <div styleName='start-3 span-1'>Tue</div>
        <div styleName='start-4 span-1'>Wed</div>
        <div styleName='start-5 span-1'>Thu</div>
        <div styleName='start-6 span-1'>Fri</div>
        <div styleName='start-7 span-1'>Sat</div>
      </div>
    );
  }
}

export default CSSModules(DaysOfWeek, styles, {allowMultiple: true});
