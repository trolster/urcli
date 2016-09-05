const readline = require('readline')
const moment = require('moment')
const notifier = require('node-notifier')
const chalk = require('chalk')
const cli = require('commander')
const config = require('../apiConfig')
const apiCall = require('./apiCall')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Make sure to catch the CTRL+C command to exit cleanly.
rl.on('SIGINT', () => {
  exit()
})

cli.parse(process.argv)

const startTime = moment()
const tickrate = 10000 // 10 seconds

// Intervals in 10 second increments.
const feedbacksInterval = 12 // 2 minutes
const positionInterval = 30 // 5 minutes
const refreshInterval = 300 // 50 minutes

const projectIds = cli.args.length ? cli.args : config.default_projects
const requestBody = {
  projects: projectIds.map(id => {
    return {
      project_id: id,
      language: config.language
    }
  })
}

let tick = 1
let assignedCount = -1
let assignedTotal = 0
let positions = []
let requestId = 0

const checkInterval = interval => tick % interval === 0

// Initialize the state by getting the number of currently assigned subs, and
// creating a new assignment request if necessary.
apiCall('count')
  .then(res => {
    assignedCount = res.body.assigned_count
    if (assignedCount !== 2) {
      createSubmissionRequest()
    }
    submissionRequests()
  })

function submissionRequests () {
  apiCall('count')
    .then(res => {
      let count = res.body.assigned_count
      if (count !== assignedCount) {
        if (count > assignedCount) {
          assignedTotal++
          assignmentNotification()
        }
        if (count === 1) {
          tick = 1
          createSubmissionRequest()
          checkFeedbacks()
        }
        assignedCount = count
      }
    })

  if (checkInterval(feedbacksInterval)) {
    checkFeedbacks()
  }

  if (checkInterval(positionInterval)) {
    checkPositions()
  }

  if (checkInterval(refreshInterval)) {
    apiCall('refresh', requestId)
  }

  setTimeout(() => {
    tick++
    setPrompt()
    submissionRequests()
  }, tickrate)
}

function createSubmissionRequest () {
  apiCall('create', '', requestBody)
    .then(res => {
      requestId = res.body.id
      checkPositions()
    })
}

function checkFeedbacks () {
  apiCall('stats')
}

function checkPositions () {
  apiCall('position', requestId)
    .then(res => {
      positions = res.body
      setPrompt()
    })
}

function assignmentNotification () {
  notifier.notify({
    title: 'New Review Assigned!',
    message: `${moment().format('HH:mm')}`,
    open: 'https://review.udacity.com/#!/submissions/dashboard',
    icon: '../assets/clipboard.png',
    sound: 'Ping'
  })
}

function exit () {
  apiCall('delete', requestId)
    .then(res => {
      console.log('Successfully deleted request and exited..')
      process.exit(0)
    })
    .catch(err => {
      console.log('Was unable to exit cleanly.')
      console.log(err)
      process.exit(1)
    })
}

function setPrompt () {
  const uptime = startTime.fromNow(true)

  const tokenExpiryWarning = () => config.tokenAge - moment().dayOfYear() < 5
  const tokenExpires = moment().dayOfYear(config.tokenAge).fromNow()

  // Clearing the screen
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)

  // Warnings
  console.log(chalk[tokenExpiryWarning() ? 'red' : 'green'](`Token expires ${tokenExpires}`))

  // Genral info
  console.log(chalk.green(`Uptime: ${chalk.white(uptime)}\n`))

  // Positions in queue
  console.log(chalk.blue('You are queued up for:\n'))
  positions.forEach(project => {
    console.log(chalk.blue(`    Project ${project.project_id} - ${config.certs[project.project_id]}`))
    console.log(chalk.yellow(`    Position in queue: ${chalk.white(project.position)}\n`))
  })
  if (!positions.length) {
    console.log(chalk.blue(`    You are currently not queued up for any projects.`))
    console.log(chalk.yellow(`    You have ${chalk.white(assignedCount)} (max) submissions assigned.`))
  }

  // Display number of assigned
  console.log(chalk.green(
    `Currently assigned: ${chalk.white(assignedCount)}`))

  // Total number of reviews assigned this session
  console.log(chalk.green(
    `Total assigned: ${chalk.white(assignedTotal)} since ${startTime.format('dddd, MMMM Do YYYY, HH:mm')}`))

  // How to exit
  console.log(chalk.green.dim(`Press ${chalk.white('ctrl+c')} to exit`))
  console.log('')
  console.log(chalk.blue('Request and response data:'))
}
