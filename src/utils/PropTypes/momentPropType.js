import moment from 'moment-timezone';
import createChainableTypeChecker from './createChainableTypeChecker';

function isPropMoment(props, propName, componentName) {
  if (!moment.isMoment(props[propName])) {
    return new Error(
      [
        componentName,
        'requires that',
        propName,
        'be a Moment object.'
      ].join(' ')
    );
  }
}

export default createChainableTypeChecker(isPropMoment);
