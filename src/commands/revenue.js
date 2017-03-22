// npm modules
import moment from 'moment';
import momentParseformat from 'moment-parseformat';
import chalk from 'chalk';
import currencyFormatter from 'currency-formatter';
// our modules
import {api, config} from '../utils';

// TODO:
// Fix imports
// Fix config.startDate
// Fix chalk.white
// Fix api.call()

const periods = [];

function definePeriods(args, options) {
  // Add one hour to the default end time to take inconsistencies into account.
  const defaultEndTime = moment.utc().add(1, 'h');
  const defaultStartTime = moment.utc('2014-01-01');
  const currentMonth = moment.utc().format('YYYY-MM');
  const currentYear = moment.utc().format('YYYY');

  const logErrorAndExit = (arg, reason) => {
    console.error(chalk.red(`\nYou have entered an invalid date: "${arg}": ${reason}`));
    console.error('\nPlease enter dates in the following format: "YYYY-MM-DD", "YYYY-MM" or "YYYY"');
    console.error('You can also use the special shortcuts "today" and "yesterday" (ex.: urcli revenue today)');
    process.exit(0);
  };

  function validateDate(date) {
    if (!moment(date).isValid()) {
      const errorReason = `The date "${date}" doesn't exist.`;
      logErrorAndExit(date, errorReason);
    }
    return true;
  }

  function createOptionsPeriod() {
    const start = options.from ? moment.utc(options.from) : defaultStartTime;
    const end = options.to ? moment.utc(options.to) : defaultEndTime;
    periods.push([start, end]);
  }

  function createYearPeriod(year) {
    const start = moment(year, 'YYYY');
    // If year is the current year the end should be today, otherwise it should be the end of the year.
    const end = year === currentYear ? defaultEndTime : moment(year, 'YYYY').endOf('year');
    periods.push([start, end]);
  }

  function createMonthPeriod(month) {
    const start = moment(month);
    // If month is the current month the end should be today, otherwise it should be the end of the month.
    const end = month === currentMonth ? defaultEndTime : moment(month).add(1, 'M');
    periods.push([start, end]);
  }

  function createDayPeriod(day) {
    const start = moment(day).startOf('day');
    const end = moment(day).endOf('day');
    periods.push([start, end]);
  }

  function createDefaultPeriods() {
    periods.push([defaultStartTime, defaultEndTime]);
    createMonthPeriod(currentMonth);
  }

  if (!args.length && !options.to && !options.from) {
    createDefaultPeriods();
  }
  if (options.from || options.to) {
    if (options.from) validateDate(options.from);
    if (options.to) validateDate(options.to);
    createOptionsPeriod();
  }

  args.forEach((arg) => {
    // Regex expressions to match user input. Note that MM and YYYY-MM inputs
    // are validated by the regex itself, while YYYY-MM-DD has to be validated
    // seperately by the moment library because of leap years and such nonsense.
    const matchYear = /^201\d{1}$/; // YYYY.
    const matchMonth = /^\d{1}$|^[01]{1}[012]{1}$/; // 1-9, 01-09 and 10-12.
    const matchYearMonth = /^201\d{1}-\d{2}$|^201\d{1}-1{1}[012]{1}$/; // YYYY-MM.
    const matchYearMonthDay = /^201\d{1}-\d{2}-\d{2}$|^201\d{1}-1{1}[012]{1}-\d{2}$/; // YYYY-MM-DD

    if (matchYearMonthDay.test(arg)) {
      validateDate(arg);
      createDayPeriod(moment.utc(arg));
    } else if (matchYearMonth.test(arg)) {
      createMonthPeriod(arg);
    } else if (matchMonth.test(arg)) {
      const year = moment().month() + 1 < arg ? moment().year() - 1 : moment().year();
      createMonthPeriod(moment().year(year).month(arg - 1).format('YYYY-MM'));
    } else if (matchYear.test(arg)) {
      createYearPeriod(arg);
    } else if (arg === 'today') {
      createDayPeriod(moment.utc());
    } else if (arg === 'yesterday') {
      createDayPeriod(moment.utc().subtract(1, 'd'));
    } else {
      if (validateDate(arg)) {
        const errorReason = `The format "${momentParseformat(arg)}" is not supported.`;
        logErrorAndExit(arg, errorReason);
      }
      throw new Error('validateDate failed to throw an error.');
    }
  });
}

class Report {
  constructor(reviews, period) {
    this.startDate = period[0].format('YYYY-MM-DD');
    this.endDate = period[1].format('YYYY-MM-DD');
    // We need to check if we're using the default startDate, so that we can
    // find the earliest date a submission was assigned. This date is needed to
    // get the correct number of days of the period, so we can calculate the
    // average daily earnings for the period.
    if (moment(this.startDate).format('DD') === '01') {
      const firstDate = reviews
        .map(review => moment(review.assigned_at)) // returns date of review
        .map(date => date.valueOf()) // returns date in Unix Time (milliseconds from 1970)
        .reduce((acc, val) => {
          if (acc < val) {
            return acc;
          }
          return val;
        }); // returns the smallest number
      this.startDate = moment(firstDate).format('YYYY-MM-DD');
    }
    this.reviews = reviews;
    this.projects = {};
    this.totalEarned = 0;
    this.totalAssigned = 0;
  }

  create() {
    this.reviews.forEach((review) => {
      this.countReview(review);
    });
  }

  countReview(review) {
    const id = review.project_id;
    const price = parseInt(review.price, 10);
    const assignedAt = moment(review.assigned_at);
    const completedAt = moment(review.completed_at);
    const turnaroundTime = completedAt.diff(assignedAt);


    // If the report does not yet contain an entry for the project type, create
    // the entry and try counting the review again.
    if (!Object.prototype.hasOwnProperty.call(this.projects, id)) {
      this.projects[id] = {
        id,
        name: review.project.name,
        passed: 0,
        failed: 0,
        ungradeable: 0,
        earned: 0,
        turnaroundTime: 0,
      };
      this.countReview(review);
    } else {
      this.projects[id][review.result] += 1;
      this.projects[id].earned += price;
      this.projects[id].turnaroundTime += turnaroundTime;
      this.totalEarned += price;
      this.totalAssigned += 1;
    }
  }

  print() {
    console.log(chalk.blue(`\nEarnings Report for ${this.startDate} to ${this.endDate}:`));
    console.log('=============================================');
    console.log(chalk.bgBlack.white(`Total Projects Assigned: ${this.totalAssigned}`));

    Object.keys(this.projects).forEach((key) => {
      const {name, id, ungradeable, passed, failed, earned, turnaroundTime} = this.projects[key];
      const totalAssigned = passed + failed + ungradeable;
      const avgTurnaroundTime = moment.utc(turnaroundTime / (totalAssigned));
      const projectInfo = `Project: ${name} (${id}):`;

      console.log(`
      ${chalk.white(projectInfo)}
      ${chalk.white(new Array(projectInfo.length + 1).join('-'))}
          ${chalk.white(`Total Assigned: ${totalAssigned}`)}
              ${chalk.white(`Reviewed: ${passed + failed}`)}
              ${chalk.white(`Ungradeable: ${ungradeable}`)}
          ${chalk.white(`Earned: ${currencyFormatter.format(earned, {code: 'USD'})}`)}
          ${chalk.white(`Average Turnaround Time: ${avgTurnaroundTime.format('HH:mm')}`)}
      `);
    });

    console.log(chalk.white(`Total Earned: ${currencyFormatter.format(this.totalEarned, {code: 'USD'})}`));

    // Only print Daily Average if we have more than one day to average
    let numberOfDays = moment(this.endDate).diff(this.startDate, 'days');
    // console.log(moment.utc().diff(this.startDate, 'days', true));
    if (numberOfDays > 1) {
      // If current month, add hours of current day to numberOfDays
      const month = moment(this.startDate).format('YYYY-MM');
      const isCurrentMonth = () => month === moment.utc().format('YYYY-MM');
      if (isCurrentMonth()) {
        numberOfDays = moment.utc().diff(moment.utc(this.startDate), 'days', true);
      }
      // Print Daily Average
      console.log(chalk.white(`Daily Average: ${
        currencyFormatter.format(this.totalEarned / numberOfDays, {code: 'USD'})}`));
    }
    console.log('=============================================');
  }
}

function printReports() {
  const resolvedReports = periods.map(async (period) => {
    const task = 'completed';
    const token = config.token;
    const body = {
      start_date: period[0].format('YYYY-MM-DDTHH:mm:ss.SSS'),
      end_date: period[1].format('YYYY-MM-DDTHH:mm:ss.SSS'),
    };

    const completed = await api({token, task, body});
    const report = new Report(completed.body, period);
    report.create();
    report.print();
    return Promise.resolve();
  });
  Promise.all(resolvedReports).then(() => process.exit(0));
}

export const revenueCmd = (args, options) => {
  const userInput = args;
  if (options.from || options.to) {
    userInput.push({from: options.from, to: options.to})
  }
  getPeriods(userInput, (err, periods) => {
    if (err) throw err;
    console.log('Yay\n\n', JSON.parse(periods));
  })
  printReports();
};
