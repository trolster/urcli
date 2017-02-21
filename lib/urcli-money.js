const cli = require('commander')
const moment = require('moment')
const chalk = require('chalk')
const currencyFormatter = require('currency-formatter');
const apiCall = require('./apiCall')
const config = require('./config')

const periods = []

cli
  .option('-f, --from <date>', 'select from <date>.', validateDate)
  .option('-t, --to <date>', 'select to <date>.', validateDate)
  .parse(process.argv)

function printReports () {
  definePeriods()
  periods.forEach(period => {
    const requestBody = {
      start_date: period[0].format('YYYY-MM-DDTHH:MM:ssZ'),
      end_date: period[1].format('YYYY-MM-DDTHH:MM:ssZ')
    }
    apiCall({
      token: config.token,
      task: 'completed',
      body: requestBody
    }).then(res => {
      let report = new Report(res.body, period)
      report.create()
      report.print()
    })
  })
}

function definePeriods () {
  // Add one hour to the default end time to take inconsistencies into account.
  const defaultEndTime = moment.utc().add(1, 'h')
  // Make default periods if the user didn't input any.
  if (!cli.args.length && !cli.to && !cli.from) {
    let month = formatMonth((moment().month() + 1).toString())
    periods.push([moment.utc('2014-01-01'), defaultEndTime])
    periods.push([moment.utc(month), defaultEndTime])
  }
  // Make options periods.
  if (cli.from || cli.to) {
    let start = cli.from ? cli.from : moment.utc('2014-01-01')
    let end = cli.to ? cli.to : defaultEndTime
    periods.push([start, end])
  }
  // Regex expressions to match user input.
  // Matches numbers from 1-12.
  const matchMonth = /^[1-9]|1[012]$/
  // Matches the format YYYY-MM.
  const matchYearMonth = /^(19|20)\d\d[- /.](0[1-9]|1[012])$/

  cli.args.forEach(arg => {
    // Testing what arguments we got from the user.
    if (matchYearMonth.test(arg)) {
      let start = moment(arg).utc()
      // Check if month asked is the current month
      if (arg === moment.utc().format('YYYY-MM')) {
         // Make the last day to query as being today
         let end = moment.utc().endOf('day')
         periods.push([start, end])
      } else {
         // Otherwise, pick the midnight of the first day of next month.
         let end = moment(arg).utc().add(1, 'M')
         periods.push([start, end])
      }
    } else if (matchMonth.test(arg)) {
      let year = moment().year()
      const month = moment().month() + 1
      if (arg > month) {
        year -= 1
      }
      const yearAndMonth = arg < 9 ? `${year}-0${arg}` : `${year}-${arg}`
      let start = moment(yearAndMonth).utc()
      // Check if month asked is the current month
      if (arg === month.toString()) {
         // Make the last day to query as being today
         let end = moment.utc().endOf('day')
         periods.push([start, end])
      } else {
         // Otherwise, pick the midnight of the first day of next month.
         let end = moment(yearAndMonth).utc().add(1, 'M')
         periods.push([start, end])
      }
    }  else if (arg === 'today') {
      let start = moment.utc().startOf('day')
      let end = moment.utc().endOf('day')
      periods.push([start, end])
    } else if (arg === 'yesterday') {
      let start = moment.utc().subtract(1, 'd').startOf('day')
      let end = moment.utc().subtract(1, 'd').endOf('day')
      periods.push([start, end])
    }
  })
}

function formatMonth (month) {
  return month.length === 1 ? `${moment().year()}-0${month}`
                            : `${moment().year()}-${month}`
}

function validateDate (date) {
  date = moment.utc(date)
  if (!date.isValid()) {
    throw new Error(`Invalid date: ${date}`)
  }
  return date
}

class Report {
  constructor (reviews, period) {
    this.period = period
    this.reviews = reviews
    this.projects = {}
    this.totalEarned = 0
    this.totalAssigned = 0
  }

  create () {
    this.reviews.forEach(review => {
      this.countReview(review)
    })
  }

  countReview (review) {
    let id = review.project_id
    let price = parseInt(review.price)
    let assigned_at = moment.utc(review.assigned_at)
    let completed_at = moment.utc(review.completed_at)
    let turnaround_time = completed_at.diff(assigned_at)

    // If the report does not yet contain an entry for the project type, create
    // the entry and try counting the review again.
    if (!this.projects.hasOwnProperty(id)) {
      this.projects[id] = {
        name: review.project.name,
        id: id,
        passed: 0,
        failed: 0,
        ungradeable: 0,
        earned: 0,
        turnaround_time: 0
      }
      this.countReview(review)
    } else {
      this.projects[id][review.result] += 1
      this.projects[id].earned += price
      this.projects[id].turnaround_time += turnaround_time
      this.totalEarned += price
      this.totalAssigned += 1
    }
  }

  print () {
    let startDate = moment(this.period[0]).format('YYYY-MM-DD')
    let endDate = moment(this.period[1]).format('YYYY-MM-DD')
    let numberOfDays = moment(endDate).diff(startDate, 'days')

    console.log(chalk.blue(`\nEarnings Report for ${startDate} to ${endDate}:`))
    console.log('=============================================')
    console.log(chalk.bgBlack.white(`Total Projects Assigned: ${this.totalAssigned}`))

    for (let p in this.projects) {
      let {name, id, ungradeable, passed, failed, earned, turnaround_time} = this.projects[p]
      let totalAssigned = passed + failed + ungradeable
      let avg_turnaround_time = moment.utc(turnaround_time/(totalAssigned))
      let projectMessage = `Project: ${name} (${id}):`

      console.log(`
      ${chalk.white(projectMessage)}
      ${chalk.white(new Array(projectMessage.length + 1).join('-'))}
          ${chalk.white(`Total Assigned: ${totalAssigned}`)}
              ${chalk.white(`Reviewed: ${passed + failed}`)}
              ${chalk.white(`Ungradeable: ${ungradeable}`)}
          ${chalk.white(`Earned: ${currencyFormatter.format(earned, {code: 'USD'})}`)}
          ${chalk.white(`Average Turnaround Time: ${avg_turnaround_time.format('HH:mm')}`)}
      `)
    }

    console.log(chalk.white(`Total Earned: ${currencyFormatter.format(this.totalEarned, {code: 'USD'})}`))

    // Only print Daily Average if we have more than one day to average
    if (numberOfDays > 1) {
        console.log(chalk.white(`Daily Average: ${currencyFormatter.format(this.totalEarned/numberOfDays, {code: 'USD'})}`))
    }
    console.log('=============================================')
  }
}

printReports()
