const readline = require('readline')
const cli = require('commander')
const moment = require('moment')
const notifier = require('node-notifier')
const chalk = require('chalk')
const winston = require('winston')
const config = require('../apiConfig')
const apiCall = require('./apiCall')

// Setting up the logging module.
winston.remove(winston.transports.Console)
winston.add(winston.transports.File, {filename: 'assign.log'})

// Getting the project ids to request for and creating the request body.
cli.parse(process.argv)
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
let assigned = new Set()
let assignedCount = 0
let requestId = 0

// The wait between calling submissionRequests().
const tickrate = 60000 // 60 seconds

// The interval (in ticks) for when to request information:
const infoInterval = 5 // 5 minutes
const refreshInterval = 40 // 40 minutes

// Information for the prompt.
const startTime = moment()
let assignedTotal = 0
let requestIds = []
let positions = []

const checkInterval = interval => tick % interval === 0

// Initialize the state by getting the number of currently assigned subs, and
// creating a new assignment request if necessary.
function init () {
  apiCall('count').then(res => {
    assignedCount = res.body.assigned_count
    if (assignedCount !== 2) {
      createSubmissionRequest()
    }
    submissionRequests()
    setPrompt()
  })
}

function submissionRequests () {
  apiCall('count')
    .then(res => {
      let count = res.body.assigned_count
      if (count !== assignedCount) {
        updateAssigned()
        if (count === 1) {
          tick = 1
          createSubmissionRequest()
          checkFeedbacks()
        }
        assignedCount = count
      }
    })
  // Check queue positions and new feedbacks.
  if (checkInterval(infoInterval)) {
    checkPositions()
    checkFeedbacks()
  }
  // Refresh the request.
  if (checkInterval(refreshInterval)) {
    apiCall('refresh', requestId).then(res => {
      winston.log('info', 'Refresh', res)
    })
  }

  setTimeout(() => {
    tick++
    setPrompt()
    submissionRequests()
  }, tickrate)
}

function checkFeedbacks () {
  apiCall('stats')
}

function checkPositions () {
  apiCall('position', requestId)
    .then(res => {
      positions = res.body.error ? [] : res.body
      setPrompt()
    })
}

function updateAssigned () {
  apiCall('assigned')
    .then(res => {
      if (res.body.length > assigned.size) {
        assignedTotal++
        let submission = res.body.filter(s => !assigned.has(s.id))[0]
        winston.log('info', 'New submission assigned.', submission)
        assignmentNotification(submission.project, submission.id)
      }
      assigned = new Set(res.body.map(s => s.id))
    })
}

function createSubmissionRequest () {
  apiCall('create', '', requestBody)
    .then(res => {
      requestId = res.body.id
      requestIds.push(requestId)
      checkPositions()
      winston.log('info', 'New submission request created.', res.body)
    })
}

function assignmentNotification ({name, id}, submissionId) {
  notifier.notify({
    title: 'New Review Assigned!',
    message: `${moment().format('HH:mm')} - ${name} (${id})`,
    open: `https://review.udacity.com/#!/submissions/${submissionId}`,
    icon: '../assets/clipboard.png',
    sound: 'Ping'
  })
}

// SETTING THE PROMPT
function setPrompt () {
  const uptime = startTime.fromNow(true)

  const tokenExpiryWarning = () => config.tokenAge - moment().dayOfYear() < 5
  const tokenExpires = moment().dayOfYear(config.tokenAge).fromNow()

  // Clearing the screen.
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)

  // Warnings.
  console.log(requestIds)
  console.log(chalk[tokenExpiryWarning() ? 'red' : 'green'](`Token expires ${tokenExpires}`))
  // Genral info.
  console.log(chalk.green(`Uptime: ${chalk.white(uptime)}\n`))
  // Positions in queue.
  console.log(chalk.blue('You are queued up for:\n'))
  positions.forEach(project => {
    console.log(chalk.blue(`    Project ${project.project_id} - ${config.certs[project.project_id]}`))
    console.log(chalk.yellow(`    Position in queue: ${chalk.white(project.position)}\n`))
  })
  if (!positions.length) {
    console.log(chalk.blue(`    You are currently not queued up for any projects.`))
    console.log(chalk.yellow(`    You have ${chalk.white(assignedCount)} (max) submissions assigned.\n`))
  }
  // Display number of assigned.
  console.log(chalk.green(
    `Currently assigned: ${chalk.white(assignedCount)}`))
  // Total number of reviews assigned this session.
  console.log(chalk.green(
    `Total assigned: ${chalk.white(assignedTotal)} since ${startTime.format('dddd, MMMM Do YYYY, HH:mm')}`))
  // How to exit.
  console.log(chalk.green.dim(`Press ${chalk.white('ctrl+c')} to exit`))
  console.log('')
  // Display raw request and response data from the api call.
  console.log(chalk.blue('Request and response data:'))
}

// EXITING THE SCRIPT
// Adding a readline interface for catching the exit command.
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Make sure to catch the CTRL+C command to exit cleanly.
rl.on('SIGINT', () => {
  apiCall('delete', requestId)
    .then(res => {
      console.log(chalk.green('Successfully deleted request and exited..'))
      process.exit(0)
    })
    .catch(err => {
      console.log(chalk.red('Was unable to exit cleanly.'))
      console.log(err)
      process.exit(1)
    })
})

// Get things started.
init()

