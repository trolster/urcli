const cli = require('commander')
const moment = require('moment')
const chalk = require('chalk')
const apiCall = require('./apiCall')

const intervals = []

cli
  .option('-f, --from <date>', 'select from <date>.', validateDate)
  .option('-t, --to <date>', 'select to <date>.', validateDate)
  .parse(process.argv)

function printReports () {
  makeIntervals()
  intervals.forEach(interval => {
    apiCall('completed', '', {
      start_date: interval[0].format('YYYY-MM-DDTHH:MM:ssZ'),
      end_date: interval[1].format('YYYY-MM-DDTHH:MM:ssZ')
    })
    .then(res => {
      let report = new Report(res.body, interval)
      report.create()
      report.print()
    })
  })
}

function makeIntervals () {
  // Make default intervals if the user didn't input any.
  if (!cli.args.length && !cli.to && !cli.from) {
    let month = formatMonth((moment().month() + 1).toString())
    intervals.push([moment.utc('2014-01-01'), moment.utc()])
    intervals.push([moment.utc(month), moment.utc()])
  }
  // Make month intervals.
  cli.args.forEach(month => {
    let start = validateDate(formatMonth(month))
    let end = moment(start).add(1, 'M')
    intervals.push([start, end])
  })
  // Make options intervals.
  if (cli.from || cli.to) {
    let start = cli.from ? cli.from : moment.utc('2014-01-01')
    let end = cli.to ? cli.to : moment.utc()
    intervals.push([start, end])
  }
}

function formatMonth (month) {
  switch (month.length) {
    case 1: return `${moment().year()}-0${month}`
    case 2: return `${moment().year()}-${month}`
    default: return month
  }
}

function validateDate (date) {
  date = moment.utc(date)
  if (!date.isValid()) {
    throw new Error(`Invalid date: ${date}`)
  }
  return date
}

class Report {
  constructor (reviews, interval) {
    this.interval = interval
    this.reviews = reviews
    this.projects = {}
    this.totalEarned = 0
  }

  create () {
    this.reviews.forEach(review => {
      this.countReview(review)
    })
  }

  countReview (review) {
    let id = review.project_id
    let price = parseInt(review.price)

    // If the report does not yet contain an entry for the project type, create
    // the entry and try counting the review again.
    if (!this.projects.hasOwnProperty(id)) {
      this.projects[id] = {
        name: review.project.name,
        id: id,
        passed: 0,
        failed: 0,
        ungradeable: 0,
        earned: 0
      }
      this.countReview(review)
    } else {
      this.projects[id][review.result] += 1
      this.projects[id].earned += price
      this.totalEarned += price
    }
  }

  print () {
    let startDate = moment(this.interval[0]).format('YYYY-MM-DD')
    let endDate = moment(this.interval[1]).format('YYYY-MM-DD')

    console.log('========================================')
    console.log(chalk.blue(`Earnings Report for ${startDate} to ${endDate}:`))

    for (let p in this.projects) {
      let {name, id, ungradeable, passed, failed, earned} = this.projects[p]
      console.log(`
      ${chalk.white(`Project: ${name} (${id}):`)}
          ${chalk.white(`Total reviewed: ${passed + failed}`)}
          ${chalk.white(`Ungradeable: ${ungradeable}`)}
          ${chalk.white(`Earned: ${earned}`)}
          `)
    }
    console.log(chalk.bgBlack.white(`Total Earned: ${this.totalEarned}`))
    console.log('========================================')
  }
}

printReports()
