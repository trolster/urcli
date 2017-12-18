import ora from 'ora';
import chalk from 'chalk';

import {api, config, formatPeriods, formatUserInput} from '../utils';
import { resolve } from 'path';

let completedReviews = [];
let certifications = [];
let ratingMap = {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0};

/**
 * This function gets the average rating considering all the projects.
 * @param {*} reviews 
 */
function rateAll(reviews) {
  reviews.map((v) => {
    ratingMap[v.rating] = ratingMap[v.rating] + 1
  })

  return reviews.reduce( (acum, value) => {
    acum = acum + value.rating;
    return acum;
  }, 0) / completedReviews.body.length;
}

/**
 * This function gets the rating by project.
 * @param {*} certifications 
 */
function rateByProjects(certifications) {
  const certifiedProjects = certifications.filter( (c) => c.status == "certified").map( (v) => { return v.project.name })
  return completedReviews.body.filter( (p) => { return certifiedProjects.includes(p.project.name) }).reduce( (acum, v) => {
    acum[v.project.name] ? (acum[v.project.name][0] = acum[v.project.name][0] + v.rating) & (acum[v.project.name][1] = acum[v.project.name][1] + 1) : (acum[v.project.name] = []) & (acum[v.project.name].push(v.rating)) & (acum[v.project.name].push(1));
    return acum;
  }, {})
}

/**
 * Main function when running `urcli rate`
 * @param {*} args 
 * @param {*} options 
 */
export const rateCmd = (args, options) => {
  const spinner = ora('Getting data...').start();
  const userInput = formatUserInput(args, options);
  const periods = formatPeriods(userInput, (err, res) => {
    if (err) throw err;
    return res;
  });
  const resolvedReports = periods.map(async (period) => {
    try {
      completedReviews = await api({
        task: 'feedbacks',
        body: {
          start_date: period[0].format('YYYY-MM-DDTHH:mm:ss.SSS'),
          end_date: period[1].format('YYYY-MM-DDTHH:mm:ss.SSS'),
        },
      });
      certifications = await api({
        task: 'certifications'
      });
      return Promise.resolve();
    } catch (e) {
      console.log(chalk.red(`\n\n  The API is returning the following error: "${e.error}"`));
      process.exit(1);
    }
  });
  Promise.all(resolvedReports).then(() => {
    spinner.succeed('Reports completed:');
    printReport();
    process.exit(0);
  });
}

/**
 * It prints out the full report for rating.
 */
function printReport() {
  let result = `# of Ratings: ${completedReviews.body.length}\n` + 
  `Your grade as a Project Reviewer is: ${rateAll(completedReviews.body).toFixed(2)}\n` +
  `Your grade as a Project Reviewer of:\n`;

  console.log(ratingMap);

  const info = rateByProjects(certifications.body);
  Object.keys(info).map( (k) => {
    result += `   - ${k} is: ${(info[k][0] / info[k][1]).toFixed(2)} in a total of ${info[k][1]} ratings.\n`
  })

  console.log(result);

}