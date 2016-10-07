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
const infoInterval = 15 // 15 * 20 seconds === 5 minutes

const checkInterval = interval => tick % interval === 0

let tick = 0
let assignedCount = 0
let assignedTotal = 0
let unreadFeedbacks = []
let requestId = 0
let positions = []

cli
  .arguments('<ids...>')
  .action((ids) => {
    // Initialize the requestBody based on the passed project ids.
    requestBody.projects = ids.map(id => {
      return {
        project_id: id,
        language: config.language
      }
    })
    // Validate ids
    const certIds = Object.keys(config.certs)
    const invalidIds = ids.filter(id => certIds.indexOf(id) === -1)
    if (invalidIds.length) {
      throw new Error(
        `Illegal Action: Not certified for project(s) ${[...invalidIds].join(', ')}`)
    }
    // Start the request loop and set the prompt.
    submissionRequests()
    setPrompt()
  })
  .parse(process.argv)

function submissionRequests () {
  // Check how many submissions are currently assigned.
  apiCall('count')
  .then(res => {
    // We only do something if assigned_count is less than maxSubmissions.
    if (res.body.assigned_count < maxSubmissions) {
      apiCall('get')
      .then(res => {
        const submissionRequest = res.body[0]
        // If there is no current submission_request we create a new one.
        if (!submissionRequest) {
          createSubmissionRequest()
          checkAssigned()
        } else {
          // If a submission_request exists at tick === 0 it was created before
          // the command ran, so we get it's info.
          if (tick === 0) {
            requestId = submissionRequest.id
            requestIds.push(requestId)
          }
          // Refresh the submission_request if it's is about to expire.
          checkRefresh(submissionRequest.closed_at)
          // Check the queue positions and for new feedbacks.
          if (checkInterval(infoInterval)) {
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
  apiCall('create', '', requestBody)
  .then(res => {
    requestId = res.body.id
    requestIds.push(requestId)
    checkPositions()
  })
  // Reset the tick to 1 rather than 0 to avoid unnecessary API calls.
  tick = 1
}

function checkRefresh (closedAt) {
  const closingIn = Date.parse(closedAt) - Date.now()
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
    const diff = res.body.unread_count - unreadFeedbacks.length
    if (diff > 0) {
      apiCall('feedbacks')
      .then(res => {
        unreadFeedbacks = res.body.filter(fb => fb.read_at === null)
        // Notify the user of the new feedbacks.
        unreadFeedbacks.slice(-diff).forEach(fb => {
          feedbackNotification(fb.rating, fb.project.name, fb.submission_id)
        })
      })
    } else if (diff < 0) {
      // Note: If you check your feedbacks in the Reviews dashboard the unread
      // count always goes to 0. Therefore we can assume that a negative
      // difference between the current unread_count and the number of elements
      // in unreadFeedbacks, will mean that the new unread_count is 0.
      unreadFeedbacks = []
    }
  })
}

function checkAssigned () {
  apiCall('assigned')
  .then(res => {
    if (res.body.length) {
      const newAssigned = res.body.filter(s => assigned.indexOf(s.id) === -1)
      newAssigned.forEach(s => {
        // Only add it to the total number of assigned if it's been assigned
        // after the command was initiated.
        if (Date.parse(s.assigned_at) > Date.parse(startTime)) {
          assignedTotal++
        }
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

function feedbackNotification (rating, name, id) {
  notifier.notify({
    title: `New ${rating}-star Feedback!`,
    message: `Project: ${name}`,
    open: `https://review.udacity.com/#!/reviews/${id}`,
    icon: '../assets/clipboard.png',
    sound: 'Pop'
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
  // Positions in request queues.
  console.log(chalk.blue('You are queued up for:\n'))
  positions.forEach(project => {
    console.log(chalk.blue(`    Project ${project.project_id} - ${config.certs[project.project_id].name}`))
    console.log(chalk.yellow(`    Position in queue: ${chalk.white(project.position)}\n`))
  })
  if (!positions.length) {
    console.log(chalk.yellow(`    You have ${chalk.white(assignedCount)} (max) submissions assigned.\n`))
  }
  // Assigned info.
  console.log(chalk.green(`Currently assigned: ${chalk.white(assignedCount)}`))
  console.log(chalk.green(`Total assigned: ${chalk.white(assignedTotal)} since ${startTime.format('dddd, MMMM Do YYYY, HH:mm')}`))
  console.log(chalk.green.dim(`Press ${chalk.white('ctrl+c')} to exit\n`))
}

// EXITING THE SCRIPT
// Adding a readline interface for catching the exit command on Windows.
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
