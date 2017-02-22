// project dependencies
const cli = require('commander');
const moment = require('moment');
const chalk = require('chalk');
const currencyFormatter = require('currency-formatter');
// our modules
const apiCall = require('./apiCall');
const config = require('./config');

const periods = [];

function validateDate(date) {
  const dateObj = moment.utc(date);
  if (!dateObj.isValid()) {
    throw new Error(`Invalid date: ${date}`);
  }
  return dateObj;
}

cli
  .option('-f, --from <date>', 'select from <date>.', validateDate)
  .option('-t, --to <date>', 'select to <date>.', validateDate)
  .parse(process.argv);

function formatMonth(month) {
  return month.length === 1 ? `${moment().year()}-0${month}`
                            : `${moment().year()}-${month}`;
}

function definePeriods() {
  // Add one hour to the default end time to take inconsistencies into account.
  const defaultEndTime = moment.utc().add(1, 'h');
  // Make default periods if the user didn't input any.
  if (!cli.args.length && !cli.to && !cli.from) {
    const month = formatMonth((moment().month() + 1).toString());
    periods.push([moment.utc('2014-01-01'), defaultEndTime]);
    periods.push([moment.utc(month), defaultEndTime]);
  }
  // Make options periods.
  if (cli.from || cli.to) {
    const start = cli.from ? cli.from : moment.utc('2014-01-01');
    const end = cli.to ? cli.to : defaultEndTime;
    periods.push([start, end]);
  }
  // Regex expressions to match user input.
  // Matches numbers from 1-12.
  const matchMonth = /^[1-9]|1[012]$/;
  // Matches the format YYYY-MM.
  const matchYearMonth = /^(19|20)\d\d[- /.](0[1-9]|1[012])$/;

  cli.args.forEach((arg) => {
    // Testing what arguments we got from the user.
    if (matchYearMonth.test(arg)) {
      const start = moment(arg).utc();
      // Check if month asked is the current month
      if (arg === moment.utc().format('YYYY-MM')) {
        // Make the last day to query as being today
        const end = moment.utc().endOf('day');
        periods.push([start, end]);
      } else {
        // Otherwise, pick the midnight of the first day of next month.
        const end = moment(arg).utc().add(1, 'M');
        periods.push([start, end]);
      }
    } else if (matchMonth.test(arg)) {
      let year = moment().year();
      const month = moment().month() + 1;
      if (arg > month) {
        year -= 1;
      }
      const yearAndMonth = arg < 9 ? `${year}-0${arg}` : `${year}-${arg}`;
      const start = moment(yearAndMonth).utc();
      // Check if month asked is the current month
      if (arg === month.toString()) {
        // Make the last day to query as being today
        const end = moment.utc().endOf('day');
        periods.push([start, end]);
      } else {
        // Otherwise, pick the midnight of the first day of next month.
        const end = moment(yearAndMonth).utc().add(1, 'M');
        periods.push([start, end]);
      }
    } else if (arg === 'today') {
      const start = moment.utc().startOf('day');
      const end = moment.utc().endOf('day');
      periods.push([start, end]);
    } else if (arg === 'yesterday') {
      const start = moment.utc().subtract(1, 'd').startOf('day');
      const end = moment.utc().subtract(1, 'd').endOf('day');
      periods.push([start, end]);
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
    if (this.startDate === '2014-01-01') {
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
    const assignedAt = moment.utc(review.assigned_at);
    const completedAt = moment.utc(review.completed_at);
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
      const projectMessage = `Project: ${name} (${id}):`;

      console.log(`
      ${chalk.white(projectMessage)}
      ${chalk.white(new Array(projectMessage.length + 1).join('-'))}
          ${chalk.white(`Total Assigned: ${totalAssigned}`)}
              ${chalk.white(`Reviewed: ${passed + failed}`)}
              ${chalk.white(`Ungradeable: ${ungradeable}`)}
          ${chalk.white(`Earned: ${currencyFormatter.format(earned, {code: 'USD'})}`)}
          ${chalk.white(`Average Turnaround Time: ${avgTurnaroundTime.format('HH:mm')}`)}
      `);
    });

    console.log(chalk.white(`Total Earned: ${currencyFormatter.format(this.totalEarned, {code: 'USD'})}`));

    // Only print Daily Average if we have more than one day to average
    const numberOfDays = moment(this.endDate).diff(this.startDate, 'days');
    if (numberOfDays > 1) {
      console.log(chalk.white(`Daily Average: ${
        currencyFormatter.format(this.totalEarned / numberOfDays, {code: 'USD'})}`));
    }
    console.log('=============================================');
  }
}

function printReports() {
  definePeriods();
  periods.forEach((period) => {
    const requestBody = {
      start_date: period[0].format('YYYY-MM-DDTHH:MM:ssZ'),
      end_date: period[1].format('YYYY-MM-DDTHH:MM:ssZ'),
    };
    apiCall({
      token: config.token,
      task: 'completed',
      body: requestBody,
    }).then((res) => {
      const report = new Report(res.body, period);
      report.create();
      report.print();
    });
  });
}

printReports();
