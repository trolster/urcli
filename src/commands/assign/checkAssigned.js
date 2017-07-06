// npm modules
import moment from 'moment';
import notifier from 'node-notifier';
import PushBullet from 'pushbullet';
import chalk from 'chalk';
// our modules
import {api, config} from '../../utils';
import env from './assignConfig';

async function checkAssigned() {
  let assignedResponse;
  try {
    assignedResponse = await api({task: 'assigned'});
  } catch (e) {
    console.log(chalk.red(`\n\n  The API is returning the following error: "${e.error}"`));
    process.exit(1);
  }
  // There are edge-cases where someone completes a reviews within the update
  // window, and also gets one assigned. This happens. So we have to always
  // check the actual reviews that are assigned. We can't just check if the
  // number of reviews has increased or decreased.
  if (assignedResponse.body.length) {
    const oldAssignedIds = env.assigned.map(s => s.id);
    const newlyAssigned = assignedResponse.body
      .filter(s => !oldAssignedIds.includes(s.id));

    if (newlyAssigned.length) {
      newlyAssigned.forEach((s) => {
        // Only add it to the total number of assigned if it's been assigned
        // after the command was initiated.
        if (Date.parse(s.assigned_at) > Date.parse(env.startTime)) {
          env.assignedTotal += 1;
        }
        // Notify the user
        const {name, id} = s.project;
        const title = `New Review Assigned! (${assignedResponse.body.length})`;
        const message = `${moment().format('HH:mm')} - ${name} (${id})`;
        const sound = 'Ping';
        const open = `https://review.udacity.com/#!/submissions/${s.id}`;
        // Desktop notifications
        notifier.notify({title, message, sound, open});
        // PushBullet notifications
        if (env.flags.push) {
          const pusher = new PushBullet(config.pushbulletToken);
          pusher.note({}, title, `${message}\n\n${open}`, (err) => {
            if (err) throw new Error(`Pushbullet error: ${err}`);
          });
        }
      });
    }
  }
  env.assigned = assignedResponse.body;
}

export default checkAssigned;
