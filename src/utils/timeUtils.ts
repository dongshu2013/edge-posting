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


export const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // If it's today, show relative time
  if (diffInSeconds < 86400) {
    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    return `${Math.floor(diffInSeconds / 3600)}h ago`;
  }

  // Otherwise show the date
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};