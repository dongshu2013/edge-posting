import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

export function formatDate(
  seconds: number | bigint,
  // template: string = "YYYY/M/D HH:mm +UTC"
  template: string = "YYYY-M-D HH:mm"
) {
  // console.log({ seconds });
  return dayjs
    .utc(Number(seconds) * 1000)
    .local()
    .format(template);
}


export function formatDuration(seconds: number | bigint) {
  if (seconds <= 0 || isNaN(Number(seconds))) {
    return "0s";
  }
  const sec_num = Number(seconds).toFixed(0);
  const months = Math.floor(Number(sec_num) / (3600 * 24 * 30)).toString();
  const weeks = Math.floor(Number(sec_num) / (3600 * 24 * 7)).toString();
  var days = Math.floor(Number(sec_num) / (3600 * 24)).toString();
  var hours = Math.floor(
    (Number(sec_num) - Number(days) * 3600 * 24) / 3600
  ).toString();
  var minutes = Math.floor(
    (Number(sec_num) - Number(days) * 3600 * 24 - Number(hours) * 3600) / 60
  ).toString();
  var secondNumber = (
    Number(sec_num) -
    Number(days) * 3600 * 24 -
    Number(hours) * 3600 -
    Number(minutes) * 60
  ).toString();

  if (Number(months) > 0) {
    return `${months} M`;
  }
  if (Number(weeks) > 0) {
    return `${weeks} W`;
  }
  if (Number(days) > 0) {
    return `${days} D`;
  }
  if (Number(hours) > 0) {
    return `${hours}h`;
  }
  if (Number(minutes) > 0) {
    return `${minutes}m`;
  }
  // if (Number(secondNumber) > 0) {
  //   return `${secondNumber}s`;
  // }
  return "<1m";
}
