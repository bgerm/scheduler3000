import React from 'react';
import {PropTypes} from 'react';
import {Gateway} from 'react-gateway';
import ReactModal2 from 'react-modal2';
import styles from './SchedulerModal.scss';

export default class SchedulerModal extends React.Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    children: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.node),
      PropTypes.node
    ])
  };

  render() {
    return (
      <Gateway into='modal'>
        <ReactModal2
          onClose={this.props.onClose}
          closeOnEsc
          closeOnBackdropClick
          backdropClassName={styles.backdrop}
          modalClassName={`${styles.modal}`}>
          {this.props.children}
        </ReactModal2>
      </Gateway>
    );
  }
}
