// npm packages
import moment from 'moment';
import momentParseformat from 'moment-parseformat';

export function definePeriods(args, cb) {
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

  args.forEach((arg) => {
    const start;
    const end;

    if (typeof arg === 'object') {
      start = arg.from ? moment.utc(arg.from) : moment.utc(config.startDate);
      end = arg.to ? moment.utc(arg.to) : moment.utc();
    } else if (matchYearMonthDay.test(arg)) {
      validateDate(arg);
      start = moment.utc(arg).startOf('day');
      end = moment.utc(arg).endOf('day');
    } else if (matchYearMonth.test(arg)) {
      start = moment(arg);
      end = month === currentMonth ? moment.utc() : moment(arg).add(1, 'M');
    } else if (matchMonth.test(arg)) {
      const year = moment().month() + 1 < arg ? moment().year() - 1 : moment().year();
      const month = moment().year(year).month(arg - 1).format('YYYY-MM');
      start = moment(month);
      end = month === currentMonth ? moment.utc() : moment(month).add(1, 'M');
    } else if (matchYear.test(arg)) {
      start = moment(arg, 'YYYY');
      end = arg === moment.utc().year() ? moment.utc() : moment(arg, 'YYYY').endOf('year');
    } else if (arg === 'today') {
      start = moment.utc().startOf('day');
      end = moment.utc().endOf('day');
    } else if (arg === 'yesterday') {
      start = moment.utc().subtract(1, 'd').startOf('day');
      end = moment.utc().subtract(1, 'd').endOf('day');
    } else {
      if (validateDate(arg)) {
        return cb(new Error('EBADDATEFORMAT'), []);
      }
      return cb(new Error('ENOMATCH'), []);
    }
    periods.push([start, end]);
  });
  return cb(false, periods);
}
