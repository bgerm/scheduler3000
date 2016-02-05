import styles from './WeeklyContainer.css';
import CSSModules from 'react-css-modules';

export default class WeeklyContainer extends React.Component {
  render() {
    return (
      <div styleName='weekly-container'>
        Weekly View.  TODO.
      </div>
    );
  }
}

WeeklyContainer.propTypes = { };
export default CSSModules(WeeklyContainer, styles, {allowMultiple: true});
