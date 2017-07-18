// node modules
import readline from 'readline';
// npm modules
import moment from 'moment';
import Table from 'cli-table2';
import chalk from 'chalk';
// our modules
import env from './assignConfig';
import {api, config} from '../../utils';

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
  if (env.flags.queue) {
    if (!env.positions.length) {
      console.log(env.positions);
      output += chalk.yellow('Waiting for queue information...\n\n');
    } else if (env.assigned.length === 2) {
      output += chalk.yellow(`You have ${chalk.white(env.assigned.length)} (max) submissions assigned.\n\n`);
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
      if (env.flags.infotext) {
        output += 'You are in the following queues:\n';
      }
      output += `${projectDetailsTable.toString()}\n\n`;
    }
  }
  return output;
};

const createAssignedDetailsTable = () => {
  let output = '';
  if (env.flags.assigned) {
    if (!env.assigned.length) {
      if (env.flags.infotext) {
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
      if (env.flags.infotext) {
        output += 'Currently assigned:\n';
      }
      output += assignedDetailsTable.toString();
    }
    output += '\n';
  }
  return output;
};

const createErrorWarning = () => {
  let output = '';
  if (env.error) {
    output += chalk.red('The API is responding with the following error message:\n');
    output += chalk.red(env.error.message);
    env.error = '';
  }
  return output;
};

const createTokenExpiryInfo = () => {
  let output = '';
  if (env.flags.infotext) {
    const expiresIn = `Token expires ${moment(config.tokenAge).fromNow()}\n\n`;
    const tokenExpiryWarning = moment(config.tokenAge).diff(moment(), 'days') < 5;
    output += tokenExpiryWarning ? chalk.red(expiresIn) : chalk.green(expiresIn);
  }
  return output;
};

const createSessionUptimeInfo = () => {
  let output = '';
  if (env.flags.infotext) {
    output += chalk.green(`Uptime: ${chalk.white(env.startTime.fromNow(true))}\n`);
  }
  return output;
};

const createSessionAssignedInfo = () => {
  let output = '';
  if (env.flags.infotext) {
    output += chalk.green(
      `Total assigned: ${chalk.white(
        env.assignedTotal
      )} since ${env.startTime.format(
        'dddd, MMMM Do YYYY, HH:mm'
      )}\nCurrent submission_request_id: ${chalk.white(
        env.submission_request.id
      )}\n`
    );
  }
  return output;
};

const createUpdateIntervalInfo = () => {
  let output = '';
  if (env.flags.infotext) {
    if (env.updatePositions) {
      if (env.flags.feedbacks) {
        output += chalk.blue('Checked for new feedbacks a few seconds ago...\n');
      }
      output += chalk.blue('Updated the queue a few seconds ago...\n');
    } else {
      const remainingSeconds = (env.updatePositionsInterval - env.tick) < 0 ?
                                env.updatePositionsInterval - (env.tick % env.updatePositionsInterval) :
                                env.updatePositionsInterval - env.tick;
      const infoIsCheckedAt = moment().add(remainingSeconds, 'seconds');
      const humanReadableMessage = moment().to(infoIsCheckedAt);

      output += chalk.blue(`Updating queue information ${humanReadableMessage}\n`);
      if (env.flags.feedbacks) {
        output += chalk.blue(`Checking for new feedbacks ${humanReadableMessage}\n`);
      }
    }
    output += '\n';
  }
  return output;
};

const createHelptext = () => {
  if (env.flags.helptext) {
    let output = '';
    output += chalk.white('\nKeyboard Shortcuts:\n\n');
    output += `Press ${chalk.white('h')} to toggle this helptext.\n`;
    output += `Press ${chalk.white('o')} for the options menu.\n`;
    output += `Press ${chalk.white('r')} to refresh the output.\n`;
    output += '\n';
    output += `Press ${chalk.white('0')} to open the review dashboard.\n`;
    output += `Press ${chalk.white('1')} or ${chalk.white('2')} to open your assigned submissions.\n`;
    output += '\n';
    output += `Press ${chalk.white('CTRL-C')} to exit the queue cleanly by deleting the submission_request.\n`;
    output += `Press ${chalk.white('ESC')} to suspend the script without deleting the submission_request.\n`;
    output += '\n';
    return chalk.green(output);
  }
  return '';
};

const createVerboseOutput = async () => {
  let output = '';
  if (env.flags.verbose) {
    const submissionRequest = await api({task: 'get'});
    output += 'Debug INFO:\n';
    output += `${chalk.blue(`List of request IDs (${env.requestIds.length}):`)} ${env.requestIds}\n`;
    output += `${chalk.blue('Submission Request returned from the server:')} ${
      JSON.stringify(submissionRequest.body[0], null, 2)}\n`;
    output += `${chalk.blue('Stored Submission Request object:')} ${
      JSON.stringify(env.submission_request, null, 2)}\n`;
  }
  return output;
};

async function setPrompt() {
  let output = '';
  if (env.flags.silent) {
    output += chalk.green('urcli is running...');
  } else {
    // Creating the output
    output += createErrorWarning();
    output += createTokenExpiryInfo();
    output += createProjectDetailsTable();
    output += createAssignedDetailsTable();
    output += createUpdateIntervalInfo();
    output += createSessionUptimeInfo();
    output += createSessionAssignedInfo();
    output += createHelptext();
    output += await createVerboseOutput();
  }
  // Clearing the screen.
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
  console.log(output);
}

export default setPrompt;
