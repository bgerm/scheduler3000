import React from 'react';
import { PropTypes } from 'react';
import SchedulerModal from './SchedulerModal';
import EventTime from './EventTime';

const propTypes = {
  onClose: PropTypes.func.isRequired,
  events: PropTypes.object.isRequired,
  eventId: PropTypes.string.isRequired,
  deleteEvent: PropTypes.func.isRequired
};

export default class SummaryModal extends React.Component {
  render() {
    const { deleteEvent, onClose, events, eventId } = this.props;
    const evnt = events[eventId];

    return (
      <SchedulerModal onClose={onClose}>
        <div className='modal-header' style={{padding: '8px 0'}}>
          <button type='button' className='close' data-dismiss='modal' aria-label='Close'
            onClick={onClose} tabIndex='-1'>
            <span aria-hidden='true'>×</span>
          </button>
          <h6 className='modal-title' style={{'width': 'calc(100% - 1.1em)'}}>Event Summary</h6>
        </div>
        <div>
          <div style={{marginTop: '10px'}}>
            <h6>{evnt.title}</h6>
            <p><EventTime event={evnt} /></p>
            <div className='clearfix'>
              <a style={{float: 'left'}}>Edit Event &raquo;</a>
              <a style={{float: 'right'}}
                onClick={() => { onClose(); deleteEvent(eventId); }}>
                Delete
              </a>
            </div>
          </div>
        </div>
      </SchedulerModal>
    );
  }
}

SummaryModal.propTypes = propTypes;
