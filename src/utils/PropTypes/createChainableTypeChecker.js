const ReactPropTypeLocationNames = require('react/lib/ReactPropTypeLocationNames');

// from some blog
export default function createChainableTypeChecker(validate) {
  function checkType(isRequired, props, propName, componentName, location) {
    componentName = componentName || 'ANONYMOUS';
    if (props[propName] == null) {
      const locationName = ReactPropTypeLocationNames[location];
      if (isRequired) {
        return new Error(
          `Required ${locationName} '${propName}' was not specified in '${componentName}'`
        );
      }
      return null;
    } else {
      return validate(props, propName, componentName, location);
    }
  }

  const chainedCheckType = checkType.bind(null, false);
  chainedCheckType.isRequired = checkType.bind(null, true);

  return chainedCheckType;
}
