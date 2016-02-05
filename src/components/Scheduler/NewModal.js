import { PropTypes } from 'react';
import SchedulerModal from './SchedulerModal';
import EventTime from './EventTime';
import momentPropType from 'utils/PropTypes/momentPropType';
import { Field, getField } from 'react-redux-form';
import classNames from 'classNames';
import uuid from 'node-uuid';

const isRequired = (value) => value !== null && value.length !== 0;

const propTypes = {
  onClose: PropTypes.func.isRequired,
  insertEvent: PropTypes.func.isRequired,
  startDate: momentPropType.isRequired,
  endDate: momentPropType.isRequired,
  formActions: PropTypes.object.isRequired,
  newEvent: PropTypes.object.isRequired,
  newEventForm: PropTypes.object.isRequired
};

export default class NewModal extends React.Component {
  componentWillMount() {
    const { startDate, endDate } = this.props;

    this.props.formActions.reset('scheduler.newEvent');
    this.props.formActions.merge('scheduler.newEvent',
      {
        id: uuid.v1(),
        startDate,
        endDate,
        allDay: true
      }
    );
  }

  handleSubmit(e) {
    e.preventDefault();
    this.props.insertEvent(this.props.newEvent);
    this.props.formActions.setSubmitted('scheduler.newEvent');
    this.props.onClose();
  }

  render() {
    const { onClose, startDate, endDate, newEventForm } = this.props;

    const titleRowClasses = classNames(
      'form-group',
      'row',
      { 'has-danger': !getField(newEventForm, 'title').valid }
    );

    return (
      <SchedulerModal onClose={onClose}>
        <div className='modal-header' style={{padding: '8px 0'}}>
          <button type='button' className='close' data-dismiss='modal' aria-label='Close' onClick={onClose} tabIndex='-1'>
            <span aria-hidden='true'>×</span>
          </button>
          <h6 className='modal-title' style={{'width': 'calc(100% - 1.1em)'}}>New Event</h6>
        </div>
        <form onSubmit={(e) => this.handleSubmit(e)}>
          <div className='form-group row'>
            <label className='col-sm-2 form-control-label'>When</label>
            <div className='col-sm-10' style={{padding: '.375rem 1rem'}}>
              <EventTime event={{startDate, endDate, allDay: true}} /> (<a>Change</a>)
            </div>
          </div>
          <div className={titleRowClasses}>
            <label className='col-sm-2 form-control-label'>What</label>
            <div className='col-sm-10'>
              <Field
                model='scheduler.newEvent.title'
                validators={{
                  required: isRequired,
                  length: (v) => !v || (v && v.length < 300)
                }}
                validateOn='blur'
              >
                <input type='text' className='form-control' autoComplete='off' placeholder='New Event' autoFocus />
                { getField(newEventForm, 'title').errors.required &&
                  <div className='text-help'>Title is required</div>
                }
                { getField(newEventForm, 'title').errors.length &&
                  <div className='text-help'>Title is too long</div>
                }
              </Field>
            </div>
          </div>
          <div className='form-group row'>
            <label className='col-sm-2'>Calendar</label>
            <div className='col-sm-10'>
              <select className='form-control'>
                <option>Default</option>
              </select>
            </div>
          </div>
          <div className='form-group row'>
            <div className='col-sm-offset-2 col-sm-10'>
              <button type='submit' className='btn btn-sm btn-primary' style={{marginRight: '10px'}}>Create Event</button>
              <a>Edit Event &raquo;</a>
            </div>
          </div>
        </form>
      </SchedulerModal>
    );
  }
}

NewModal.propTypes = propTypes;
