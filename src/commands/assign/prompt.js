// npm modules
import moment from 'moment';
import Table from 'cli-table2';
import chalk from 'chalk';
// our modules
import env from './assignConfig';
import {config} from '../../utils';

let output;

// Create a new table for projects that the user is queued up for
const projectDetails = new Table({
  head: [
    {hAlign: 'center', content: 'pos'},
    {hAlign: 'center', content: 'id'},
    {hAlign: 'left', content: 'project name'},
    {hAlign: 'center', content: 'lang'}],
  colWidths: [5, 7, 40, 7],
});

// Shows assigned projects in a table
const assignedDetails = new Table({
  head: [
    {hAlign: 'center', content: 'key'},
    {hAlign: 'left', content: 'project name'},
    {hAlign: 'center', content: 'expires'},
    {hAlign: 'center', content: 'price'}],
  colWidths: [5, 40, 15, 8],
});

const createProjectDetails = () => {
  if (!env.positions.length) {
    output += chalk.yellow('Waiting for queue information...\n');
  } else if (env.assigned.length === 2) {
    output += chalk.yellow(`    You have ${chalk.white(env.assigned.length)} (max) submissions assigned.\n`);
  } else {
    projectDetails.length = 0;
    env.positions
      .sort((p1, p2) => p1.position - p2.position)
      .forEach((project) => {
        projectDetails.push([
          {hAlign: 'center', content: project.position},
          {hAlign: 'center', content: project.project_id},
          {hAlign: 'left', content: config.certs[project.project_id].name},
          {hAlign: 'center', content: project.language},
        ]);
      });
    output += `QUEUE:\n${projectDetails.toString()}`;
  }
};

const createAssignedDetails = () => {
  if (!env.assigned.length) {
    output += chalk.yellow('No submissions are currently assigned.\n');
  } else {
    assignedDetails.length = 0;
    env.assigned
      .forEach((submission, idx) => {
        const assignedAt = moment.utc(submission.assigned_at);
        const completeTime = assignedAt.add(12, 'hours');
        assignedDetails.push([
          {hAlign: 'center', content: idx + 1},
          {hAlign: 'left', content: submission.project.name},
          {hAlign: 'center', content: completeTime.fromNow()},
          {hAlign: 'center', content: submission.price},
        ]);
      });
    output += `ASSIGNED:\n${assignedDetails.toString()}`;
  }
};

const createWarning = () => {
  if (env.error) {
    output += chalk.red('The API is currently not responding, or very slow to respond. Trying to reconnect...\n');
  }
  const tokenExpiryWarning = moment(config.tokenAge).diff(moment(), 'days') < 5;
  if (tokenExpiryWarning) {
    output += chalk.red(`Token expires ${moment(config.tokenAge).fromNow()}`);
  }
};

const createSessionInfo = () => {
  if (env.flags.sessionDetails) {
    output += chalk.green(`Uptime: ${chalk.white(env.startTime.fromNow(true))}\nTotal assigned: ${
      chalk.white(env.assignedTotal)} since ${env.startTime.format('dddd, MMMM Do YYYY, HH:mm')}\n`);
    if (env.tick % env.checkInfoInterval === 0) {
      if (env.flags.feedbacks) {
        output += chalk.blue('Checked for new feedbacks a few seconds ago...\n');
      }
      output += chalk.blue('Checked the queue a few seconds ago...\n');
    } else {
      const remainingSeconds = (env.checkInfoInterval - (env.tick % env.checkInfoInterval)) * (env.tickrate / 1000);
      const infoIsCheckedAt = moment().add(remainingSeconds, 'seconds');
      const humanReadableMessage = moment().to(infoIsCheckedAt);
      if (env.flags.feedbacks) {
        output += chalk.blue(`Checking feedbacks ${humanReadableMessage}\n`);
      }
      output += chalk.blue(`Updating queue information ${humanReadableMessage}\n`);
    }
  }
};

const createHelptext = () => {
  if (env.flags.helptext) {
    output += 'KEYBOARD SHORTCUTS:\n';
    output += chalk.green.dim(`  Press ${
      chalk.white('0')} to open the review dashboard.`);
    output += chalk.green.dim(`  Press ${
      chalk.white('1')} or ${chalk.white('2')} to open your assigned submissions.\n`);
    output += chalk.green.dim(`  Press ${
      chalk.white('ctrl+c')} to exit the queue cleanly by deleting the submission_request.`);
    output += chalk.green.dim(`  Press ${
      chalk.white('ESC')} to suspend the script without deleting the submission_request.\n`);
  }
};

export default () => {
  createWarning();
  createProjectDetails();
  createAssignedDetails();
  if (!env.flags.silent) {
    createSessionInfo();
    createHelptext();
  }
  return output;
};
