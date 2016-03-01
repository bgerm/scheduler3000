import React from 'react';
import { Route, IndexRoute, IndexRedirect } from 'react-router';

import CoreLayout from 'layouts/CoreLayout';
import MainLayout from 'layouts/MainLayout';
import SchedulerLayout from 'layouts/SchedulerLayout';
import HomeView from 'views/HomeView';
import AboutView from 'views/AboutView';
import MonthlyContainer from 'containers/Scheduler/MonthlyContainer';
import WeeklyContainer from 'containers/Scheduler/WeeklyContainer';

export default (store) => (
  <Route path='/' component={CoreLayout}>
    <Route component={MainLayout}>
      <IndexRoute component={HomeView} />
      <Route path='/about' component={AboutView} />
    </Route>

    <Route path='scheduler' component={SchedulerLayout}>
      <IndexRedirect to='monthly' />
      <Route path='monthly' component={MonthlyContainer} />
      <Route path='weekly' component={WeeklyContainer} />
    </Route>
  </Route>
);
