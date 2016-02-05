import styles from './Header.css';
import CSSModules from 'react-css-modules';

function Header() {
  return (
    <header styleName='header'>
      <h1>The Scheduler 3000</h1>
    </header>
  );
}

export default CSSModules(Header, styles);
