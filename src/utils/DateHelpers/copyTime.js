export default function copyTime(srcDate, destDate) {
  return destDate.clone()
    .hours(srcDate.hours())
    .minutes(srcDate.minutes())
    .seconds(srcDate.seconds());
};
