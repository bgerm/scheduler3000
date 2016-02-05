export default function (startDate, endDate, stepValue = 1, stepUnit = 'day') {
  const days = [];

  for (let d = startDate.clone();
    d <= endDate;
    d = d.clone().add(stepValue, stepUnit)) {
    days.push(d);
  }

  return days;
};

