// node modules
import readline from 'readline';
// npm modules
import moment from 'moment';
import Table from 'cli-table2';
import chalk from 'chalk';
// our modules
import env from './assignConfig';
import {config} from '../../utils';

// Create a new table for projects that the user is queued up for
const projectDetailsTable = new Table({
  head: [
    {hAlign: 'center', content: 'pos'},
    {hAlign: 'center', content: 'id'},
    {hAlign: 'left', content: 'project name'},
    {hAlign: 'center', content: 'lang'}],
  colWidths: [5, 7, 40, 7],
});

// Shows assigned projects in a table
const assignedDetailsTable = new Table({
  head: [
    {hAlign: 'center', content: 'key'},
    {hAlign: 'left', content: 'project name'},
    {hAlign: 'center', content: 'expires'},
    {hAlign: 'center', content: 'price'}],
  colWidths: [5, 40, 15, 8],
});

const createProjectDetailsTable = () => {
  let output = '';
  if (!env.positions.length) {
    console.log(env.positions);
    output += chalk.yellow('Waiting for queue information...\n');
  } else if (env.assigned.length === 2) {
    output += chalk.yellow(`    You have ${chalk.white(env.assigned.length)} (max) submissions assigned.\n`);
  } else {
    projectDetailsTable.length = 0;
    env.positions
      .sort((p1, p2) => p1.position - p2.position)
      .forEach((project) => {
        projectDetailsTable.push([
          {hAlign: 'center', content: project.position},
          {hAlign: 'center', content: project.project_id},
          {hAlign: 'left', content: config.certs[project.project_id].name},
          {hAlign: 'center', content: project.language},
        ]);
      });
    if (env.flags.helptext && !env.flags.silent) {
      output += 'You are in the following queues:\n';
    }
    output += `${projectDetailsTable.toString()}\n\n`;
  }
  return output;
};

const createAssignedDetailsTable = () => {
  let output = '';
  if (!env.assigned.length) {
    if (env.flags.helptext && !env.flags.silent) {
      output += chalk.yellow('No submissions are currently assigned.\n');
    }
  } else {
    assignedDetailsTable.length = 0;
    env.assigned
      .forEach((submission, idx) => {
        const assignedAt = moment.utc(submission.assigned_at);
        const completeTime = assignedAt.add(12, 'hours');
        assignedDetailsTable.push([
          {hAlign: 'center', content: idx + 1},
          {hAlign: 'left', content: submission.project.name},
          {hAlign: 'center', content: completeTime.fromNow()},
          {hAlign: 'center', content: submission.price},
        ]);
      });
    output += `Currently assigned:\n${assignedDetailsTable.toString()}`;
  }
  output += '\n';
  return output;
};

const createWarning = () => {
  let output = '';
  if (env.error) {
    output += chalk.red('The API is responding with the following error message:\n');
    output += chalk.red(env.error.message);
    env.error = '';
  }
  const tokenExpiryWarning = moment(config.tokenAge).diff(moment(), 'days') < 5;
  if (tokenExpiryWarning) {
    output += chalk.red(`Token expires ${moment(config.tokenAge).fromNow()}\n\n`);
  }
  return output;
};

const createSessionInfo = () => {
  let output = '';
  output += chalk.green(`Uptime: ${chalk.white(env.startTime.fromNow(true))}\nTotal assigned: ${
    chalk.white(env.assignedTotal)} since ${env.startTime.format('dddd, MMMM Do YYYY, HH:mm')}\n`);
  output += '\n';
  if (env.updateInfo) {
    if (env.flags.feedbacks) {
      output += chalk.blue('Checked for new feedbacks a few seconds ago...\n');
    }
    output += chalk.blue('Updated the queue a few seconds ago...\n');
  } else {
    const remainingSeconds = (env.updateInfoInterval - env.tick) < 0 ?
                             env.updateInfoInterval - (env.tick % env.updateInfoInterval) :
                             env.updateInfoInterval - env.tick;
    const infoIsCheckedAt = moment().add(remainingSeconds, 'seconds');
    const humanReadableMessage = moment().to(infoIsCheckedAt);
    if (env.flags.feedbacks) {
      output += chalk.blue(`Checking for new feedbacks ${humanReadableMessage}\n`);
    }
    output += chalk.blue(`Updating queue information ${humanReadableMessage}\n`);
  }
  output += '\n';
  return output;
};

const createHelptext = () => {
  let output = '';
  output += 'KEYBOARD SHORTCUTS:\n\n';
  output += chalk.green.dim(`  Press ${chalk.white('0')} to open the review dashboard.\n`);
  output += chalk.green.dim(`  Press ${
    chalk.white('1')} or ${chalk.white('2')} to open your assigned submissions.\n\n`);
  output += chalk.green.dim(`  Press ${chalk.white('h')} to toggle this helptext.\n`);
  output += chalk.green.dim(`  Press ${chalk.white('i')} to toggle extra infotext.\n`);
  output += chalk.green.dim(`  Press ${chalk.white('s')} to toggle all extra information off.\n`);
  output += chalk.green.dim(`  Press ${chalk.white('r')} to refresh the output.\n`);
  output += chalk.green.dim(`\n  Press ${
    chalk.white('CTRL-C')} to exit the queue cleanly by deleting the submission_request.\n`);
  output += chalk.green.dim(`  Press ${
    chalk.white('ESC')} to suspend the script without deleting the submission_request.\n`);
  return output;
};

const helptext = createHelptext();

function setPrompt() {
  let output = '';
  // Clearing the screen.
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
  // Creating the output
  output += createWarning();
  output += createProjectDetailsTable();
  output += createAssignedDetailsTable();
  if (!env.flags.silent) {
    if (env.flags.infotext) {
      output += createSessionInfo();
    }
    if (env.flags.helptext) {
      output += helptext;
    }
  }
  console.log(output);
}

export default setPrompt;
