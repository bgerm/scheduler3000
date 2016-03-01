import React, { PropTypes } from 'react';
import Header from 'components/Header/Header';
import styles from './MainLayout.scss';
import CSSModules from 'react-css-modules';
import { Link } from 'react-router';

function MainLayout ({ children }) {
  return (
    <div className='vflex'>
      <Header />

      <div styleName='main'>
        {children}
      </div>

      <footer styleName='footer'>
        <ul>
          <li><Link to='/about'>About</Link></li>
          <li><a>Sign Up</a></li>
          <li><Link to='/scheduler/'>Just Take Me To The Scheduler Now, Please</Link></li>
        </ul>
      </footer>
    </div>
  );
}

MainLayout.propTypes = {
  children: PropTypes.element
};

export default CSSModules(MainLayout, styles, {allowMultiple: true});

