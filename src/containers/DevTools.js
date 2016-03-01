import React from 'react';
import { createDevTools } from 'redux-devtools';
import LogMonitorConsole from 'redux-devtools-log-monitor-console';
import DockMonitor from 'redux-devtools-dock-monitor';
import FilterMonitor from 'redux-devtools-filter-actions';
import { actionTypes as dragActionTypes } from 'redux/modules/scheduler/drag';

const blacklistedActions = [
  dragActionTypes.ENTER_CELL,
  dragActionTypes.UPDATE_DRAG
];

export default createDevTools(
  <DockMonitor
    toggleVisibilityKey='ctrl-h'
    defaultIsVisible={false}
    changePositionKey='ctrl-q' >
    <FilterMonitor blacklist={blacklistedActions}>
      <LogMonitorConsole />
    </FilterMonitor>
  </DockMonitor>
);
