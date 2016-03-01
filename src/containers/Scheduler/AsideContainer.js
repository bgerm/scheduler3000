import React from 'react';
import styles from './AsideContainer.css';
import CSSModules from 'react-css-modules';

class AsideContainer extends React.Component {
  render() {
    return (
      <div styleName='aside'>
        <h3>Calendars</h3>
        <p>Home</p>
      </div>
    );
  }
}

export default CSSModules(AsideContainer, styles);
