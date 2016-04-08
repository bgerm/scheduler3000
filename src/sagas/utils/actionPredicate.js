export default function actionPredicate(actions) {
  return (filterable) => actions.some((action) =>
    (action) === filterable.action.type);
}
