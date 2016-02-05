import styles from './HomeView.scss';
import CSSModules from 'react-css-modules';

class HomeView extends React.Component {
  render () {
    return (
      <div styleName='login-panel'>
        <h4>Sign in to play secretary</h4>

        <form>
          <div className='form-group'>
            <input type='text' className='form-control' placeholder='Email' autoFocus />
          </div>
          <div className='form-group'>
            <input type='password' className='form-control' placeholder='Password' />
          </div>
          <div className='form-group'>
            <button type='submit' className='btn btn-primary'>Sign In</button>
          </div>
          <div className='form-group' styleName='centered'>
            <a>Forgot your password?</a>
          </div>
        </form>
      </div>
    );
  }
}

export default CSSModules(HomeView, styles, {allowMultiple: true});
