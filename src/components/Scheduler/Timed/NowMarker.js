import React, { PropTypes } from 'react';
import styles from './NowMarker.scss';
import CSSModules from 'react-css-modules';

const propTypes = {
  period: PropTypes.object.isRequired
};

class NowMarker extends React.Component {
  render() {
    return (
      <div styleName='now-marker' style={{top: '300px'}}></div>
    );
  }
}

NowMarker.propTypes = propTypes;
export default CSSModules(NowMarker, styles, {allowMultiple: true});
