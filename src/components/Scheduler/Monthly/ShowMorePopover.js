import { PropTypes } from 'react';
import styles from './ShowMorePopover.scss';
import CSSModules from 'react-css-modules';
import classNames from 'classNames';

const propTypes = {
  onClose: PropTypes.func.isRequired,
  target: PropTypes.object.isRequired,
  targetContainer: PropTypes.object.isRequired,
  events: PropTypes.object.isRequired,
  startDate: PropTypes.object.isRequired,
  ids: PropTypes.object.isRequired
};

class ShowMorePopover extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      left: 0,
      top: 0,
      xPopoverPosition: 'left',
      yPopoverPosition: 'top'
    };

    this.position = this.position.bind(this);
    this.closeIfClickedOutside = this.closeIfClickedOutside.bind(this);
  }

  componentDidMount() {
    this.position();

    window.addEventListener('resize', this.position);
    document.addEventListener('mousedown', this.closeIfClickedOutside);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.position);
    document.removeEventListener('mousedown', this.closeIfClickedOutside);
  }

  closeIfClickedOutside(e) {
    if (e.target.closest('.' + styles['js-id']) === null) {
      this.props.onClose();
    }
  }

  position() {
    const { target, targetContainer } = this.props;

    const targetRect = target.getBoundingClientRect();
    const targetContainerRect = targetContainer.getBoundingClientRect();
    const popoverRect = this.refs.popover.getBoundingClientRect();

    const topPadding = 9;

    let autoLeft = targetRect.left - targetContainerRect.left;
    let autoTop = targetRect.top - targetContainerRect.top + targetRect.height + topPadding;
    let yPopoverPosition = 'top';
    let xPopoverPosition = 'left';

    if (autoTop + popoverRect.height + topPadding > targetContainerRect.height) {
      autoTop = targetRect.top - targetContainerRect.top - topPadding - popoverRect.height;
      yPopoverPosition = 'bottom';
    }

    if (autoLeft + popoverRect.width > targetContainerRect.width) {
      autoLeft = targetRect.left - targetContainerRect.left - popoverRect.width + (targetRect.width);
      xPopoverPosition = 'right';
    }

    this.setState({left: autoLeft, top: autoTop, xPopoverPosition, yPopoverPosition});
  }

  renderEvents(ids, events) {
    return ids.map(id => {
      const evnt = events[id];
      return <div key={evnt.id} styleName='event'>{evnt.title}</div>;
    });
  }

  render() {
    const { left, top, xPopoverPosition, yPopoverPosition } = this.state;
    const { ids, events, startDate } = this.props;

    const popoverStyle = {
      left: `${left}px`,
      top: `${top}px`
    };

    const popoverClassNames = classNames(
      'more-popover',
      'js-id',
      xPopoverPosition,
      yPopoverPosition
    );

    return (
      <div className='popover' styleName={popoverClassNames} style={popoverStyle} ref='popover'>
        <div className='popover-arrow'></div>
        <h3 className='popover-title'>
          { startDate.format('dddd, MMMM D') }
        </h3>

        <div className='popover-content'>
          { this.renderEvents(ids, events) }
        </div>
      </div>
    );
  }
}
ShowMorePopover.propTypes = propTypes;

export default CSSModules(ShowMorePopover, styles, {allowMultiple: true});
