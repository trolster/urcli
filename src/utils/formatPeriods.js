// npm packages
import moment from 'moment';

export function formatPeriods(args, cb) {
  let err;
  const periods = [];
  const currentMonth = moment.utc().format('YYYY-MM');

  function validateDate(arg) {
    if (!moment(arg).isValid()) {
      return cb(new Error('EINVALIDDATE'), []);
    }
    return true;
  }

  // Regex expressions to match user input. Note that MM and YYYY-MM inputs
  // are validated by the regex itself, while YYYY-MM-DD has to be validated
  // seperately by the moment library because of leap years and such nonsense.
  const matchYear = /^201\d{1}$/; // YYYY.
  const matchMonth = /^\d{1}$|^[01]{1}[012]{1}$/; // 1-9, 01-09 and 10-12.
  const matchYearMonth = /^201\d{1}-\d{2}$|^201\d{1}-1{1}[012]{1}$/; // YYYY-MM.
  const matchYearMonthDay = /^201\d{1}-\d{2}-\d{2}$|^201\d{1}-1{1}[012]{1}-\d{2}$/; // YYYY-MM-DD

  const argsLength = args.length;
  for (let i = 0; i < argsLength; i += 1) {
    const arg = args[i];
    let start;
    let end;

    if (typeof arg === 'object') {
      start = moment.utc(arg.from);
      end = moment.utc(arg.to);
    } else if (matchYearMonthDay.test(arg)) {
      validateDate(arg);
      start = moment.utc(arg).startOf('day');
      end = moment.utc(arg).endOf('day');
    } else if (matchYearMonth.test(arg)) {
      start = moment.utc(arg);
      end = arg === currentMonth ? moment.utc() : moment.utc(arg).endOf('month');
    } else if (matchMonth.test(arg)) {
      const year = moment().month() + 1 < arg ? moment().year() - 1 : moment().year();
      const month = moment().year(year).month(arg - 1).format('YYYY-MM');
      start = moment.utc(month);
      end = month === currentMonth ? moment.utc() : moment.utc(month).endOf('month');
    } else if (matchYear.test(arg)) {
      start = moment.utc(arg, 'YYYY');
      end = arg === moment.utc().year() ? moment.utc() : moment.utc(arg, 'YYYY').endOf('year');
    } else if (arg === 'week') {
      start = moment.utc().startOf('week');
      end = moment.utc().endOf('week');
    } else if (arg === 'today') {
      start = moment.utc().startOf('day');
      end = moment.utc().endOf('day');
    } else if (arg === 'yesterday') {
      start = moment.utc().subtract(1, 'd').startOf('day');
      end = moment.utc().subtract(1, 'd').endOf('day');
    } else {
      if (validateDate(arg)) {
        err = new Error('EBADDATEFORMAT');
      } else {
        err = new Error('ENOMATCH');
      }
      break;
    }
    periods.push([start, end]);
  }

  if (err) return cb(err, []);
  return cb(false, periods);
}
