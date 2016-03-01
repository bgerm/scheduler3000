import React from 'react';
import { PropTypes } from 'react';
import styles from './HeaderContainer.scss';
import CSSModules from 'react-css-modules';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as PeriodActions from 'redux/modules/scheduler/period';
import { pushPath } from 'redux-simple-router';
import classNames from 'classNames';

const propTypes = {
  period: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
  nextPeriod: PropTypes.func.isRequired,
  previousPeriod: PropTypes.func.isRequired,
  toToday: PropTypes.func.isRequired,
  isFetching: PropTypes.bool.isRequired,
  notification: PropTypes.string.isRequired
};

export default class HeaderContainer extends React.Component {
  prettyDate() {
    const { period } = this.props;

    const selectedDate = period.get('selectedDate');
    const startDate = period.get('startDate');
    const periodType = period.get('periodType');

    if (periodType === 'monthly') {
      return selectedDate.format('MMMM YYYY');
    } else if (periodType === 'weekly') {
      const endDate = startDate.clone().add(6, 'days');
      return `${startDate.format('MMM D')} - ${endDate.format('MMM D, YYYY')}`;
    }

    return '';
  }

  render() {
    const { notification, dispatch, nextPeriod, previousPeriod, toToday, isFetching } = this.props;

    const spinnerStyleName = classNames(
      'spinner',
      {'visible': isFetching}
    );

    const noticeStyles = classNames(
      'notice',
      {'visible': notification.length > 0}
    );

    return (
      <div styleName='component-topbar' className='clearfix'>
        <div styleName={noticeStyles} role='alert'>
          {notification}
        </div>
        <div styleName='topbar-left'>
          <div className='btn-group' role='group' aria-label='Change'>
            <button type='button' className='btn btn-sm btn-secondary' onClick={toToday}>Today</button>
            <button type='button' className='btn btn-sm btn-secondary' onClick={previousPeriod}>&lt;</button>
            <button type='button' className='btn btn-sm btn-secondary' onClick={nextPeriod}>&gt;</button>
          </div>
        </div>

        <div styleName='topbar-center'>
          <div styleName='current-date'>{this.prettyDate()}</div>
          <div styleName={spinnerStyleName} className='clearfix'>
            <div styleName='bounce1'></div>
            <div styleName='bounce2'></div>
            <div></div>
          </div>
        </div>

        <div styleName='topbar-right'>
          <div className='btn-group' role='group' aria-label='Change'>
            <button type='button' className='btn btn-sm btn-secondary'
              onClick={() => dispatch(pushPath('/scheduler/weekly'))}>Weekly</button>
            <button type='button' className='btn btn-sm btn-secondary'
              onClick={() => dispatch(pushPath('/scheduler/monthly'))}>Monthly</button>
          </div>
        </div>
      </div>
    );
  }
}

HeaderContainer.propTypes = propTypes;
const StyledHeaderContainer = CSSModules(HeaderContainer, styles, {allowMultiple: true});

function mapStateToProps(state) {
  return {
    period: state.scheduler.period,
    isFetching: state.scheduler.events.fetching.length > 0,
    notification: state.scheduler.notification
  };
}

function mapDispatchToProps(dispatch) {
  return {...bindActionCreators(PeriodActions, dispatch), dispatch};
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(StyledHeaderContainer);
