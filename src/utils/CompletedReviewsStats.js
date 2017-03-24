import moment from 'moment';
import {Config} from './';

const config = new Config();

export class CompletedReviewsStats {
  constructor(reviews, period) {
    this.period = period;
    this.startDate = period[0].format('YYYY-MM-DD');
    if (moment(config.startDate).isAfter(this.startDate)) {
      this.startDate = config.startDate;
    }
    this.endDate = period[1].format('YYYY-MM-DD');
    this.projects = {};
    this.totalEarned = 0;
    this.totalAssigned = 0;

    reviews.forEach((review) => {
      this.countReview(review);
    });
    Object.keys(this.projects).forEach((id) => {
      const stats = this.projects[id];
      stats.avgTurnaroundTime = stats.totalTurnaroundTime / stats.totalAssigned;
    });
  }

  countReview(review) {
    const id = review.project_id;
    const price = parseInt(review.price, 10);
    const assignedAt = moment(review.assigned_at);
    const completedAt = moment(review.completed_at);
    const turnaroundTime = completedAt.diff(assignedAt);

    // If the report does not yet contain an entry for the project type, create
    // the entry and try counting the review again.
    if (!Object.prototype.hasOwnProperty.call(this.projects, id)) {
      this.projects[id] = {
        id,
        name: review.project.name,
        passed: 0,
        failed: 0,
        ungradeable: 0,
        earned: 0,
        totalTurnaroundTime: 0,
        totalAssigned: 0,
      };
      this.countReview(review);
    } else {
      this.projects[id][review.result] += 1;
      this.projects[id].earned += price;
      this.projects[id].totalTurnaroundTime += turnaroundTime;
      this.projects[id].totalAssigned += 1;
      this.totalEarned += price;
      this.totalAssigned += 1;
    }
  }
}
