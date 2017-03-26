// npm modules
import moment from 'moment';
import Table from 'cli-table2';
import chalk from 'chalk';

function prompt(options) {
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

  function createProjectDetailsTable() {
    // Push projects, sorted by queue position, into the projectDetails table
    projectDetails.length = 0;
    positions
      .sort((p1, p2) => p1.position - p2.position)
      .forEach((project) => {
        projectDetails.push([
          {hAlign: 'center', content: project.position},
          {hAlign: 'center', content: project.project_id},
          {hAlign: 'left', content: certs[project.project_id].name},
          {hAlign: 'center', content: project.language},
        ]);
      });
    return projectDetails.toString();
  }

  function createAssignedDetailsTable() {
    // Push assigned, sorted by time left, into the assignedDetails table
    assignedDetails.length = 0;
    assigned
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
    return assignedDetails.toString();
  }

  // Warnings on error
  if (error) {
    console.log(chalk.red('The API is currently not responding, or very slow to respond.'));
    console.log(chalk.red('The script will continue to run and try to get a connection.'));
    console.log(chalk.red(`Error Code: ${error}`));
  }

  // Token expiry warning
  const tokenExpiryWarning = moment(tokenAge).diff(moment(), 'days') < 5;
  const tokenExpires = moment(tokenAge).fromNow();
  console.log(chalk[tokenExpiryWarning ? 'red' : 'green'](`Token expires ${tokenExpires}`));

  // General info.
  console.log(chalk.green(`Uptime: ${chalk.white(startTime.fromNow(true))}\n`));
  // Positions in request queues.
  console.log(chalk.blue('You are queued up for:\n'));

  // console.log a warning if max number of submissions are assigned, otherwise
  // console.log the projectDetails table
  if (assigned.length === 2) {
    console.log(chalk.yellow(`    You have ${chalk.white(assigned.length)} (max) submissions assigned.\n`));
  } else if (!positions.length) {
    console.log(chalk.yellow('Waiting for project details...\n'));
  } else {
    console.log(`${createProjectDetailsTable()}\n`);
  }

  // Assigned info.
  if (assigned.length) {
    const count = assigned.length === 1 ? 'one submission' : 'two submissions';
    console.log(chalk.yellow(`You currently have ${count} assigned:\n`));
    console.log(`${createAssignedDetailsTable()}\n`);
  } else {
    console.log(chalk.yellow('No submissions are currently assigned.\n'));
  }

  if (!options.silent) {
    // Shows the number of projects that were assigned since the start of urcli
    console.log(chalk.green(`Total assigned: ${
      chalk.white(assignedTotal)} since ${startTime.format('dddd, MMMM Do YYYY, HH:mm')}\n`));

    // Info on when the next check will occur for queue position and feedbacks.
    if (tick % infoInterval === 0) {
      if (options.feedbacks) {
        console.log(chalk.blue('Checked for new feedbacks a few seconds ago...'));
      }
      console.log(chalk.blue('Checked the queue a few seconds ago...\n'));
    } else {
      const remainingSeconds = (infoInterval - (tick % infoInterval)) * (tickrate / 1000);
      const infoIsCheckedAt = moment().add(remainingSeconds, 'seconds');
      const humanReadableMessage = moment().to(infoIsCheckedAt);
      if (options.feedbacks) {
        console.log(chalk.blue(`Checking feedbacks ${humanReadableMessage}`));
      }
      console.log(chalk.blue(`Updating queue information ${humanReadableMessage}\n`));
    }

    // Keyboard shortcuts helptext
    console.log('KEYBOARD SHORTCUTS:\n');
    console.log(chalk.green.dim(`  Press ${
      chalk.white('0')} to open the review dashboard.`));
    console.log(chalk.green.dim(`  Press ${
      chalk.white('1')} or ${chalk.white('2')} to open your assigned submissions.\n`));
    console.log(chalk.green.dim(`  Press ${
      chalk.white('ctrl+c')} to exit the queue cleanly by deleting the submission_request.`));
    console.log(chalk.green.dim(`  Press ${
      chalk.white('ESC')} to suspend the script without deleting the submission_request.\n`));
  }
  return output;
}

export default prompt;
