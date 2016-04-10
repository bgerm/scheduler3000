import React, { PropTypes } from 'react';
import styles from './HourMarkers.scss';
import CSSModules from 'react-css-modules';
import { range } from 'lodash';

const propTypes = {
  startHour: PropTypes.number.isRequired,
  endHour: PropTypes.number.isRequired
};

class HourMarkers extends React.Component {
  render() {
    const { startHour, endHour } = this.props;

    const hourMarkers = range(startHour, endHour).map((hour) => {
      const amPm = hour >= 11 ? 'PM' : 'AM';
      const showHour = ((hour + 11) % 12) + 1;

      return (
        <div key={`marker-${hour}`} styleName='hour-marker'>
          {showHour} {amPm}
        </div>
      );
    });

    return (
      <div styleName='hour-markers'>
        {hourMarkers}
      </div>
    );
  }
}

HourMarkers.propTypes = propTypes;
export default CSSModules(HourMarkers, styles, {allowMultiple: true});
