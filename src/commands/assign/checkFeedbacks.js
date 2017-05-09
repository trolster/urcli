// npm modules
import notifier from 'node-notifier';
// our modules
import {api} from '../../utils';
import env from './assignConfig';

const checkFeedbacks = async () => {
  const stats = await api({task: 'stats'});
  const diff = stats.body.unread_count - env.unreadFeedbacks.length;

  if (diff > 0) {
    const feedbacksResponse = await api({task: 'feedbacks'});
    env.unreadFeedbacks = feedbacksResponse.body.filter(fb => fb.read_at === null);
    // Notify the user of the new feedbacks.
    if (env.flags.feedbacks) {
      env.unreadFeedbacks.slice(-diff).forEach((fb) => {
        notifier.notify({
          title: `New ${fb.rating}-star Feedback!`,
          message: `Project: ${fb.project.name}`,
          sound: 'Pop',
          open: `https://review.udacity.com/#!/reviews/${fb.submission_id}`,
        });
      });
    }
  } else if (stats.body.unread_count === 0) {
    env.unreadFeedbacks = [];
  }
};

export default checkFeedbacks;
