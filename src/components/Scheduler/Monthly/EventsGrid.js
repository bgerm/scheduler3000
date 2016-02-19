import { PropTypes } from 'react';
import styles from './EventsGrid.scss';
import CSSModules from 'react-css-modules';
import Week from './Week';
import { range } from 'utils/DateHelpers';
import ShowMorePopover from 'components/Scheduler/Monthly/ShowMorePopover';

const propTypes = {
  period: PropTypes.object.isRequired,
  events: PropTypes.object,
  positioned: PropTypes.object,
  dragId: PropTypes.string,
  editMouseDown: PropTypes.func.isRequired,
  updateShowLimit: PropTypes.func.isRequired
};

class EventsGrid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {height: null, target: null, targetId: null, targetStartDate: null};
    this.handleResize = this.handleResize.bind(this);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const { period, dragId, positioned } = this.props;

    return !(nextProps.period === period &&
      nextProps.dragId === dragId &&
      nextProps.positioned === positioned && this.state.targetId === nextState.targetId);
  }

  showMoreEvents(event, ids, startDate) {
    this.setState({target: event.target, targetId: ids, targetStartDate: startDate});
  }

  renderPopover () {
    if (this.state.targetId === null) return null;

    return (
      <ShowMorePopover
        target={this.state.target}
        targetContainer={this.refs.container}
        events={this.props.events}
        ids={this.state.targetId}
        startDate={this.state.targetStartDate}
        onClose={() => this.setState({targetId: null, target: null})}
      />
    );
  }

  handleResize() {
    setTimeout(() => {
      const { period } = this.props;

      const startDate = period.get('startDate');
      const endDate = period.get('endDate');

      const weekCount = endDate.diff(startDate, 'weeks') + 1;

      const container = this.refs.container;

      if (container !== undefined) {
        const height = container.offsetHeight;

        // TODO more dynamic
        const eventHeight = 18;
        const padding = 2;

        const showLimit = parseInt(((height / weekCount) / eventHeight), 10) - padding;

        this.props.updateShowLimit(showLimit);
      }
    }, 0);
  }

  componentDidMount() {
    this.handleResize();

    window.addEventListener('resize', this.handleResize);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
  }

  render() {
    const { period, editMouseDown, dragId, events, positioned } = this.props;

    const startDate = period.get('startDate');
    const endDate = period.get('endDate');
    const today = period.get('today');

    const weekStarts = range(startDate, endDate, 1, 'week');

    const weeks = weekStarts.map(x => {
      const weekPositions = positioned.get(x.format('YYYYMMDD'));

      return (<Week
        startDate={x}
        editMouseDown={editMouseDown}
        today={today}
        dragId={dragId}
        events={events}
        positioned={weekPositions}
        key={x.valueOf()}
        showMoreEvents={this.showMoreEvents.bind(this)}
      />);
    });

    return (
      <div styleName='weeks' ref='container'>
        { this.renderPopover() }
        { weeks }
      </div>
    );
  }
}

EventsGrid.propTypes = propTypes;

export default CSSModules(EventsGrid, styles, {allowMultiple: true});
