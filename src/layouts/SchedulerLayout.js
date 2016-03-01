import React from 'react';
import Header from 'components/Header/Header';
import AsideContainer from 'containers/Scheduler/AsideContainer';
import HeaderContainer from 'containers/Scheduler/HeaderContainer';

const containerStyle = {
  padding: '0 0.5rem 0.5rem 0',
  minWidth: '600px',
  minHeight: '500px'
};

function SchedulerLayout ({ children }) {
  return (
    <div className='vflex'>
      <Header />

      <section className='hflex'>
        <AsideContainer />

        <section className='vflex' style={containerStyle}>
          <HeaderContainer />

          {children}
        </section>
      </section>
    </div>
  );
}

SchedulerLayout.propTypes = {
  children: React.PropTypes.element
};

export default SchedulerLayout;
