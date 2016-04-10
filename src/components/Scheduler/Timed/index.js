import React, { PropTypes } from 'react';
import styles from './index.scss';
import CSSModules from 'react-css-modules';
import NowMarker from './NowMarker';
import WeekGrid from './WeekGrid';

const propTypes = {
  period: PropTypes.object.isRequired,
  events: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired
};

class Timed extends React.Component {
  render() {
    const { period } = this.props;

    return (
      <div style={{position: 'absolute', height: '100%', width: '100%'}}>
        <WeekGrid period={period} />
        <NowMarker period={period} />
      </div>
    );
  }
}

Timed.propTypes = propTypes;
export default CSSModules(Timed, styles, {allowMultiple: true});
