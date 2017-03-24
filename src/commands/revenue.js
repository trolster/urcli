// npm modules
import moment from 'moment';
import chalk from 'chalk';
import currencyFormatter from 'currency-formatter';
// our modules
import {Api, Config, getPeriods} from '../utils';

const config = new Config();
const api = new Api(config.token);

class Report {
  constructor(reviews, period) {
    this.startDate = period[0].format('YYYY-MM-DD');
    if (moment(config.startDate).isAfter(this.startDate)) {
      this.startDate = config.startDate;
    }
    this.endDate = period[1].format('YYYY-MM-DD');
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
    console.log(`Total Projects Assigned: ${this.totalAssigned}`);

    Object.keys(this.projects).forEach((key) => {
      const {name, id, ungradeable, passed, failed, earned, turnaroundTime} = this.projects[key];
      const totalAssigned = passed + failed + ungradeable;
      const avgTurnaroundTime = moment.utc(turnaroundTime / (totalAssigned));
      const projectInfo = `Project: ${name} (${id}):`;

      console.log(`
      ${projectInfo}
      ${new Array(projectInfo.length + 1).join('-')}
          ${`Total Assigned: ${totalAssigned}`}
              ${`Reviewed: ${passed + failed}`}
              ${`Ungradeable: ${ungradeable}`}
          ${`Earned: ${currencyFormatter.format(earned, {code: 'USD'})}`}
          ${`Average Turnaround Time: ${avgTurnaroundTime.format('HH:mm')}`}
      `);
    });

    console.log(`Total Earned: ${currencyFormatter.format(this.totalEarned, {code: 'USD'})}`);

    // Only print Daily Average if we have more than one day to average
    let numberOfDays = moment(this.endDate).diff(this.startDate, 'days');
    console.log(`Number of days: ${numberOfDays}`);
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

function printReports(periods) {
  const resolvedReports = periods.map(async (period) => {
    const completed = await api.call({
      task: 'completed',
      body: {
        start_date: period[0].format('YYYY-MM-DDTHH:mm:ss.SSS'),
        end_date: period[1].format('YYYY-MM-DDTHH:mm:ss.SSS'),
      },
    });
    const report = new Report(completed.body, period);
    report.create();
    report.print();
    return Promise.resolve();
  });
  Promise.all(resolvedReports).then(() => process.exit(0));
}

export const revenueCmd = (args, options) => {
  const userInput = args;
  // Check if the user is using the --from and --to flags.
  if (options.from || options.to) {
    userInput.push({
      from: options.from || config.startDate,
      to: options.to || moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS'),
    });
  }
  // If the user didn't input any args, we create a period that represents
  // the total time the reviewer has been actively reviewing projects.
  if (!args.length) {
    userInput.push({
      from: config.startDate,
      to: moment().endOf('day').format('YYYY-MM-DDTHH:mm:ss.SSS'),
    });
  }
  getPeriods(userInput, (err, res) => {
    if (err) throw err;
    printReports(res);
  });
};
