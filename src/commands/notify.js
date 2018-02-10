// node modules
import readline from 'readline';
// npm modules
import moment from 'moment';
import notifier from 'node-notifier';
import PushBullet from 'pushbullet';
import chalk from 'chalk';
import Table from 'cli-table2';
// our modules
import {api, config} from '../utils';

const env = {
  push: false,
  startTime: moment(),
  assigned: [],
  assignedTotal: 0,
};

// Shows assigned projects in a table
const assignedDetailsTable = new Table({
  head: [
    {hAlign: 'center', content: 'key'},
    {hAlign: 'left', content: 'project name'},
    {hAlign: 'center', content: 'expires'},
    {hAlign: 'center', content: 'price'}],
  colWidths: [5, 40, 15, 8],
});

const createAssignedDetailsTable = () => {
  if (!env.assigned.length) {
    return chalk.yellow('No submissions are currently assigned.');
  }
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
  return `Currently assigned:\n${assignedDetailsTable.toString()}`;
};

function setPrompt() {
  // Clearing the screen.
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);
  console.log(createAssignedDetailsTable());
  console.log('\n\nWill check for new assignments every 30 seconds...');
}

async function checkAssigned() {
  let res;
  try {
    res = await api({task: 'assigned'});
  } catch (e) {
    const errMsg = chalk.red(
      `\n\n  The API is returning the following error: '${e.error}'`);
    console.log(errMsg);
  }

  if (res.body.length) {
    const oldAssignedIds = env.assigned.map(s => s.id);
    const newlyAssigned = res.body.filter(s => !oldAssignedIds.includes(s.id));

    if (newlyAssigned.length) {
      newlyAssigned.forEach((s) => {
        // Only add it to the total number of assigned if it's been assigned
        // after the command was initiated.
        if (Date.parse(s.assigned_at) > Date.parse(env.startTime)) {
          env.assignedTotal += 1;
        }
        // Notify the user
        const {name, id} = s.project;
        const title = `New Review Assigned! (${res.body.length})`;
        const message = `${moment().format('HH:mm')} - ${name} (${id})`;
        const sound = 'Ping';
        const open = `https://review.udacity.com/#!/submissions/${s.id}`;
        // Desktop notifications
        notifier.notify({title, message, sound, open});
        // PushBullet notifications
        if (env.push) {
          const pusher = new PushBullet(config.pushbulletToken);
          pusher.note({}, title, `${message}\n\n${open}`, (err) => {
            if (err) throw new Error(`Pushbullet error: ${err}`);
          });
        }
      });
    }
  }
  env.assigned = res.body;
  setPrompt();
}

export default (options) => {
  if (options.push) {
    env.push = true;
  }
  checkAssigned();
  setInterval(() => {
    checkAssigned();
  }, 30000);
};
