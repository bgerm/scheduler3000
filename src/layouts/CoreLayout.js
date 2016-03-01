import React, { PropTypes } from 'react';
import '../styles/core.scss';
import { GatewayProvider, GatewayDest } from 'react-gateway';

function CoreLayout ({ children }) {
  return (
    <GatewayProvider>
      <div style={{height: '100%'}}>
        <div className='viewport'>
          {children}
        </div>
        <GatewayDest name='modal' className='modal-container'/>
      </div>
    </GatewayProvider>
  );
}

CoreLayout.propTypes = {
  children: PropTypes.element
};

export default CoreLayout;
