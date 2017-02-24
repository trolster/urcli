// node modules
const readline = require('readline');
// project dependencies
const cli = require('commander');
const moment = require('moment');
const notifier = require('node-notifier');
const chalk = require('chalk');
const Table = require('cli-table2');
const PushBullet = require('pushbullet');
// our modules
const config = require('./config');
const apiCall = require('./apiCall');

const startTime = moment();
const requestBody = {};
const assigned = [];
// The wait between calling submissionRequests().
const tickrate = 30000; // 30 seconds
const infoInterval = 10; // 10 * 30 seconds === 5 minutes

let tick = 0;
let assignedCount = 0;
let assignedTotal = 0;
let requestId = 0;
let unreadFeedbacks = [];
let positions = [];
let projectIds = [];

// The PushBullet object
const devices = [];
let pusher;

// ******************
// SETTING THE PROMPT
// ******************

function setPrompt() {
  // Clearing the screen.
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);

  // Warnings.
  const tokenExpiryWarning = moment(config.tokenAge).diff(moment(), 'days') < 5;
  const tokenExpires = moment(config.tokenAge).fromNow();
  console.log(chalk[tokenExpiryWarning ? 'red' : 'green'](`Token expires ${tokenExpires}`));

  // General info.
  console.log(chalk.green(`Uptime: ${chalk.white(startTime.fromNow(true))}\n`));
  // Positions in request queues.
  console.log(chalk.blue('You are queued up for:\n'));

  // Create a new table for projects that the user is queued up for
  const projectDetails = new Table({
    head: [
      {hAlign: 'center', content: 'pos'},
      {hAlign: 'center', content: 'id'},
      {hAlign: 'left', content: 'name'},
      {hAlign: 'center', content: 'lang'}],
    colWidths: [5, 7, 40, 7],
  });

  // Push projects, sorted by queue position, into the projectDetails table
  positions
    .sort((p1, p2) => p1.position - p2.position)
    .forEach((project) => {
      projectDetails.push([
        {hAlign: 'center', content: project.position},
        {hAlign: 'center', content: project.project_id},
        {hAlign: 'left', content: config.certs[project.project_id].name},
        {hAlign: 'center', content: project.language},
      ]);
    });

  // console.log a warning if max number of submissions are assigned, otherwise
  // console.log the projectDetails table
  if (!positions.length) {
    console.log(chalk.yellow(`    You have ${chalk.white(assignedCount)} (max) submissions assigned.\n`));
  } else {
    console.log(`${projectDetails.toString()}\n`);
  }

  // Info on when the next check will occur for queue position and feedbacks.
  if (tick % infoInterval === 0) {
    console.log(chalk.blue('Checked the queue a few seconds ago...'));
    console.log(chalk.blue('Checked for new feedbacks a few seconds ago...\n'));
  } else {
    const remainingSeconds = (infoInterval - (tick % infoInterval)) * (tickrate / 1000);
    const infoIsCheckedAt = moment().add(remainingSeconds, 'seconds');
    const humanReadableMessage = moment().to(infoIsCheckedAt);
    console.log(chalk.blue(`Updating queue information ${humanReadableMessage}`));
    console.log(chalk.blue(`Checking feedbacks ${humanReadableMessage}\n`));
  }

  // Assigned info.
  console.log(chalk.green(`Currently assigned: ${chalk.white(assignedCount)}`));
  console.log(chalk.green(`Total assigned: ${
    chalk.white(assignedTotal)} since ${startTime.format('dddd, MMMM Do YYYY, HH:mm')}\n`));
  // How to exit.
  console.log(chalk.green.dim(`Press ${
    chalk.white('ctrl+c')} to exit the queue cleanly by deleting the submission_request.`));
  console.log(chalk.green.dim(`Press ${
    chalk.white('ESC')} to suspend the script without deleting the submission_request.\n`));
}

// *************
// NOTIFICATIONS
// *************

function assignmentNotification(projectInfo, submissionId) {
  const {name, id} = projectInfo;
  const title = `New Review Assigned! (${assignedCount})`;
  const message = `${moment().format('HH:mm')} - ${name} (${id})`;
  const open = `https://review.udacity.com/#!/submissions/${submissionId}`;
  const sound = 'Ping';

  // If the --push flag is set we push to active PushBullet devices
  if (cli.push) {
    pusher.note({}, title, `${message}\n\n${open}`, (err) => {
      if (err) {
        console.error(err);
        throw new Error('Failed to push to any active devices.');
      }
    });
  }
  notifier.notify({title, message, open, sound});
}

function feedbackNotification(rating, name, id) {
  notifier.notify({
    title: `New ${rating}-star Feedback!`,
    message: `Project: ${name}`,
    open: `https://review.udacity.com/#!/reviews/${id}`,
    sound: 'Pop',
  });
}

// This gets called if a submission_request is already active when the assign
// command is run. If the new project ids, input by the user, do not equal the
// project ids in the existing submission_request, we update the request.
let needToUpdate = (submissionRequest) => {
  needToUpdate = () => false;
  const submissionRequestProjectIds = submissionRequest.submission_request_projects
    .map(p => p.project_id);

  if (submissionRequestProjectIds.length !== projectIds.length) return true;

  const invalidIds = submissionRequestProjectIds
    .filter(id => projectIds.indexOf(id) === -1);
  return invalidIds.length;
};

function checkPositions() {
  apiCall({
    token: config.token,
    task: 'position',
    id: requestId,
  }).then((res) => {
    positions = res.body.error ? [] : res.body;
    setPrompt();
  });
}

function updateSubmissionRequest() {
  apiCall({
    token: config.token,
    task: 'update',
    id: requestId,
    body: requestBody,
  }).then((res) => {
    requestId = res.body.id;
    checkPositions();
  });
  // Reset tick to reset the timers.
  tick = 0;
}

function createSubmissionRequest() {
  apiCall({
    token: config.token,
    task: 'create',
    body: requestBody,
  }).then((res) => {
    requestId = res.body.id;
    checkPositions();
  });
  // Reset tick to reset the timers.
  tick = 0;
}

function checkRefresh(closedAt) {
  const closingIn = Date.parse(closedAt) - Date.now();
  // If it expires in less than 5 minutes we refresh.
  if (closingIn < 300000) {
    apiCall({
      token: config.token,
      task: 'refresh',
      id: requestId,
    });
  }
}

function checkFeedbacks() {
  apiCall({
    token: config.token,
    task: 'stats',
  }).then((res) => {
    const diff = res.body.unread_count - unreadFeedbacks.length;
    if (diff > 0) {
      apiCall({
        token: config.token,
        task: 'feedbacks',
      }).then((response) => {
        unreadFeedbacks = response.body.filter(fb => fb.read_at === null);
        // Notify the user of the new feedbacks.
        unreadFeedbacks.slice(-diff).forEach((fb) => {
          feedbackNotification(fb.rating, fb.project.name, fb.submission_id);
        });
      });
    } else if (diff < 0) {
      // Note: If you check your feedbacks in the Reviews dashboard the unread
      // count always goes to 0. Therefore we can assume that a negative
      // difference between the current unread_count and the number of elements
      // in unreadFeedbacks, will mean that the new unread_count is 0.
      unreadFeedbacks = [];
    }
  });
}

function checkAssigned() {
  apiCall({
    token: config.token,
    task: 'assigned',
  }).then((res) => {
    if (res.body.length) {
      const newAssigned = res.body.filter(s => assigned.indexOf(s.id) === -1);
      newAssigned.forEach((s) => {
        // Only add it to the total number of assigned if it's been assigned
        // after the command was initiated.
        if (Date.parse(s.assigned_at) > Date.parse(startTime)) {
          assignedTotal += 1;
        }
        // Add the id of the newly assigned submission to the list of assigned
        // submissions.
        assigned.push(s.id);
        assignmentNotification(s.project, s.id);
      });
    }
  });
}

// ***************
// CALLING THE API
// ***************

function submissionRequests() {
  // Call API to check how many submissions are currently assigned.
  apiCall({
    token: config.token,
    task: 'count',
  }).then((res) => {
    // If assigned_count has gone up we check the new submission assignment.
    if (assignedCount < res.body.assigned_count) {
      checkAssigned();
    }
    assignedCount = res.body.assigned_count;
    // If then the assignedCount is less than the maximum number of assignments
    // allowed, we go through checking the submission_request.
    if (assignedCount < 2) {
      apiCall({
        token: config.token,
        task: 'get',
      }).then((response) => {
        const submissionRequest = response.body[0];
        // If there is no current submission_request we create a new one.
        if (!submissionRequest) {
          createSubmissionRequest();
        } else {
          requestId = submissionRequest.id;

          if (needToUpdate(submissionRequest)) {
            updateSubmissionRequest();
          } else {
            // Refresh the submission_request if it's is about to expire.
            checkRefresh(submissionRequest.closed_at);
            // Check the queue positions and for new feedbacks.
            if (tick % infoInterval === 0) {
              checkPositions();
              checkFeedbacks();
            }
          }
        }
      });
    }
  });
  setTimeout(() => {
    tick += 1;
    setPrompt();
    submissionRequests();
  }, tickrate);
}

// ********************
// HANDLE STARTUP TASKS
// ********************

function validateAccessToken(accessToken) {
  pusher = new PushBullet(accessToken);
  // Get a list of active devices that can be pushed to for later use.
  pusher.devices((err, res) => {
    if (err) throw new Error('PushBullet error: ', err);
    if (!res.devices.length) throw new Error('Found no active devices to push to.');
    res.devices.forEach(device => devices.push(device.iden));
  });
}

cli
  .arguments('<ids...>')
  .option('-p, --push <accessToken>', 'Get push notifications using <accessToken>.', validateAccessToken)
  .action((ids) => {
    projectIds = ids;
    // Get ids for all certified projects
    const certIds = Object.keys(config.certs);
    // Validate ids if the user passed them in as arguments.
    if (ids[0] !== 'all') {
      const invalidIds = ids.filter(id => certIds.indexOf(id) === -1);
      if (invalidIds.length) {
        throw new Error(
          `Illegal Action: Not certified for project(s) ${[...invalidIds].join(', ')}`);
      }
    } else {
      projectIds = certIds;
    }
    // Create a list of project/language pairs
    requestBody.projects = [];
    config.languages.forEach((language) => {
      /* eslint-disable camelcase */
      projectIds.forEach((project_id) => {
        requestBody.projects.push({project_id, language});
      });
    });
    // Start the request loop and set the prompt.
    submissionRequests();
    setPrompt();
  })
  .parse(process.argv);

// ******************
// EXITING THE SCRIPT
// ******************

// It's necessary to add a readline interface to catch <ctrl>-C on Windows.
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Exit cleanly on <ctrl>-C by deleting the submission_request.
rl.on('SIGINT', () => {
  apiCall({
    token: config.token,
    task: 'delete',
    id: requestId,
  }).then(() => {
    console.log(chalk.green('Successfully deleted request and exited..'));
    process.exit(0);
  }).catch((err) => {
    console.log(chalk.red('Was unable to exit cleanly.'));
    console.error(err);
    process.exit(1);
  });
});

// Suspend on ESC and refresh the submission_request rather than deleting it.
process.stdin.on('data', (key) => {
  /* eslint-disable eqeqeq */
  if (key == '\u001b') {
    apiCall({
      token: config.token,
      task: 'refresh',
      id: requestId,
    });
    console.log(chalk.green('Exited without deleting the submission_request...'));
    console.log(chalk.green('The current submission_request will expire in an hour.'));
    process.exit(0);
  }
});
