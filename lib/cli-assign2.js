const readline = require('readline')
const cli = require('commander')
const moment = require('moment')
const notifier = require('node-notifier')
const chalk = require('chalk')
const config = require('../apiConfig')
const apiCall = require('./apiCall')

const startTime = moment()
const requestBody = {}
const assigned = []
const requestIds = []
// The wait between calling submissionRequests().
const tickrate = 20000 // 20 seconds
const infoInterval = 300000 // 5 minutes

const checkInterval = interval => (tick * tickrate) % interval === 0

let tick = 0
let assignedCount = 0
let requestId = 0
let positions = []

cli
  .description('Place requests in the queue.')
  .arguments('<ids...>')
  .action((ids) => {
    requestBody.projects = ids.map(id => {
      return {
        project_id: id,
        language: config.language
      }
    })
    submissionRequests()
  })
  .parse(process.argv)

function submissionRequests () {
  apiCall('count')
  .then(res => {
    assignedCount = res.body.assigned_count
    if (assignedCount < 2) {
      apiCall('get')
      .then(res => {
        if (!res.body.length) {
          createSubmissionRequest()
          updateAssigned()
        } else {
          requestId = res.body[0].id
          if (requestIds.filter(requestId) === -1) {
            requestIds.push(requestId)
          }
          if (checkInterval(infoInterval)) {
            checkPositions()
          }
        }
      })
    }
  })

  setTimeout(() => {
    tick++
    submissionRequests()
    setPrompt()
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

  const uptime = startTime.fromNow(true)

  // Warnings.
  console.log(requestIds)

  console.log(chalk.green(`Uptime: ${chalk.white(uptime)}\n`))
  console.log(chalk.blue('You are queued up for:\n'))
  positions.forEach(project => {
    console.log(chalk.blue(`    Project ${project.project_id} - ${config.certs[project.project_id]}`))
    console.log(chalk.yellow(`    Position in queue: ${chalk.white(project.position)}\n`))
  })
  if (!positions.length) {
    console.log(chalk.blue(`    You are currently not queued up for any projects.`))
    console.log(chalk.yellow(`    You have ${chalk.white(assignedCount)} (max) submissions assigned.\n`))
  }
  console.log(chalk.green(`Currently assigned: ${chalk.white(assignedCount)}`))
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
