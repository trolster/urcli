// npm modules
import moment from 'moment';
import chalk from 'chalk';
import currencyFormatter from 'currency-formatter';
import ora from 'ora';
// our modules
import {Api, Config, formatPeriods, ReviewsStats} from '../utils';

const config = new Config();
const api = new Api(config.token);

function print(report) {
  let output = `${chalk.blue(`\nEarnings Report for ${report.startDate} to ${report.endDate}:`)}\n`;

  Object.keys(report.projects).forEach((key) => {
    const {name, id, ungradeable, passed, failed, earned, avgTurnaroundTime, totalAssigned} = report.projects[key];
    const projectInfo = `Project: ${name} (${id}):`;

    output += `
    ${projectInfo}
    ${new Array(projectInfo.length + 1).join('-')}
        Total Assigned: ${totalAssigned}
            Reviewed: ${passed + failed}
            Ungradeable: ${ungradeable}
        Earned: ${currencyFormatter.format(earned, {code: 'USD'})}
        Average Turnaround Time: ${moment(avgTurnaroundTime).format('HH:mm')}\n`;
  });

  const totalEarned = currencyFormatter.format(report.totalEarned, {code: 'USD'});
  output += `\nTotal Earned: ${totalEarned}\n`;

  if (report.numberOfDays) {
    const dailyAverage = currencyFormatter.format(report.dailyAverage, {code: 'USD'});
    output += `Daily Average: ${dailyAverage}\n`;
  }
  output += '=============================================';
  return output;
}

function formatUserInput(args, options) {
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
  return userInput;
}

export const revenueCmd = (args, options) => {
  const spinner = ora('Getting data...').start();
  let output = '';
  const userInput = formatUserInput(args, options);
  const periods = formatPeriods(userInput, (err, res) => {
    if (err) throw err;
    return res;
  });
  // Output reports for each period
  const resolvedReports = periods.map(async (period) => {
    const completedReviews = await api.call({
      task: 'completed',
      body: {
        start_date: period[0].format('YYYY-MM-DDTHH:mm:ss.SSS'),
        end_date: period[1].format('YYYY-MM-DDTHH:mm:ss.SSS'),
      },
    });
    const report = new ReviewsStats(completedReviews.body, period);
    output += print(report);
    return Promise.resolve();
  });
  Promise.all(resolvedReports).then(() => {
    spinner.succeed('Reports completed:');
    console.log(output);
    process.exit(0);
  });
};
