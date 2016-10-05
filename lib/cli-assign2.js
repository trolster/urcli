const readline = require('readline')
const cli = require('commander')
const moment = require('moment')
const notifier = require('node-notifier')
const chalk = require('chalk')
const config = require('../apiConfig')
const apiCall = require('./apiCall')

const maxSubmissions = 2
const startTime = moment()
const requestBody = {}
const assigned = []
const requestIds = []
// The wait between calling submissionRequests().
const tickrate = 20000 // 20 seconds
const infoInterval = 15

const checkInterval = interval => tick % interval === 0

let tick = 0
let assignedCount = 0
let requestId = 0
let positions = []

// Initialize the requestBody based on the passed project ids.
cli
  .arguments('<ids...>')
  .action((ids) => {
    requestBody.projects = ids.map(id => {
      return {
        project_id: id,
        language: config.language
      }
    })
    // TODO: Validation...
    submissionRequests()
    setPrompt()
  })
  .parse(process.argv)

// Start the request loop.
function submissionRequests () {
  apiCall('count')
  .then(res => {
    assignedCount = res.body.assigned_count
    // We only ever do anything if assigned_count is less than maxSubmissions.
    if (assignedCount < maxSubmissions) {
      apiCall('get')
      .then(res => {
        let submissionRequest = res.body[0]
        // If there is no current submission_request we create a new one.
        if (!submissionRequest) {
          createSubmissionRequest()
          checkAssigned()
        } else {
          // In case a submission_request exists at the start we get its info.
          if (tick === 0) {
            requestId = submissionRequest.id
            requestIds.push(requestId)
          }
          // Refresh if the submission_request is about to expire.
          checkRefresh(submissionRequest)
          // Check for info at an interval.
          if (checkInterval(infoInterval)) {
            // Check positions in the queue and update the prompt.
            checkPositions()
            checkFeedbacks()
          }
        }
      })
    }
  })

  setTimeout(() => {
    tick++
    setPrompt()
    submissionRequests()
  }, tickrate)
}

function createSubmissionRequest () {
  tick = 1
  apiCall('create', '', requestBody)
  .then(res => {
    requestId = res.body.id
    requestIds.push(requestId)
    checkPositions()
  })
}

function checkRefresh (submissionRequest) {
  let closingAt = submissionRequest.closed_at
  let closingIn = Date.parse(closingAt) - Date.now()
  // If it expires in less than 5 minutes we refresh.
  if (closingIn < 300000) {
    apiCall('refresh', requestId)
  }
}

function checkPositions () {
  apiCall('position', requestId)
  .then(res => {
    positions = res.body.error ? [] : res.body
    setPrompt()
  })
}

function checkFeedbacks () {
  apiCall('stats')
  .then(res => {
    const unread = res.body.unread_count
    if (unread) {
      apiCall('feedbacks')
      .then(res => {
        console.log(res.body)
      })
    }
  })
}

function checkAssigned () {
  apiCall('assigned')
  .then(res => {
    if (res.body.length) {
      let newAssigned = res.body.filter(s => assigned.indexOf(s.id) === -1)
      newAssigned.forEach(s => {
        assigned.push(s)
        assignmentNotification(s.project, s.id)
      })
    }
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
  // Clearing the screen.
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)

  // Debug
  console.log(requestIds)

  // Warnings.
  const tokenExpiryWarning = () => config.tokenAge - moment().dayOfYear() < 5
  const tokenExpires = moment().dayOfYear(config.tokenAge).fromNow()
  console.log(chalk[tokenExpiryWarning() ? 'red' : 'green'](`Token expires ${tokenExpires}`))

  // General info.
  console.log(chalk.green(`Uptime: ${chalk.white(startTime.fromNow(true))}\n`))
  console.log(chalk.blue('You are queued up for:\n'))
  positions.forEach(project => {
    console.log(chalk.blue(`    Project ${project.project_id} - ${config.certs[project.project_id]}`))
    console.log(chalk.yellow(`    Position in queue: ${chalk.white(project.position)}\n`))
  })
  if (!positions.length) {
    console.log(chalk.yellow(`    You have ${chalk.white(assignedCount)} (max) submissions assigned.\n`))
  }
  console.log(chalk.green(`Currently assigned: ${chalk.white(assignedCount)}`))
  console.log(chalk.green.dim(`Press ${chalk.white('ctrl+c')} to exit\n`))
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
