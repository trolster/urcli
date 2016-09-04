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

cli.parse(process.argv)

const startTime = moment()
const tickrate = 10000 // 10 seconds
let tick = 0

let assignedCount = 0
let assignedTotal = 0

let body = projectList()
let positions = []

let requestId = 0

// Intervals in 10 second increments.
const countInterval = 1 // 10 seconds
const positionInterval = 6 // 1 minute
const feedbacksInterval = 30 // 5 minutes
const refreshInterval = 300 // 50 minutes

const checkInterval = interval => tick % interval === 0
const countdown = interval => interval - tick % interval
const tokenExpiryWarning = () => config.tokenAge - moment().dayOfYear() < 5

// Start by creating a finding out how many projects are assigned.
setPrompt()
apiCall('count')
  .then(res => {
    tick++
    assignedCount = res.body.assigned_count
    if (assignedCount === 2) {
      submissionRequests()
    } else {
      apiCall('create', '', body)
        .then(res => {
          requestId = res.body.id
          apiCall('position', requestId)
            .then(res => {
              positions = res.body
              setPrompt()
              submissionRequests()
            })
        })
    }
  })

function submissionRequests () {
  if (checkInterval(countInterval)) {
    apiCall('count')
      .then(res => {
        let count = res.body.assigned_count
        if (count > assignedCount) {
          assignedTotal++
          assignedCount++
          // Notify the user.
          notifier.notify({
            title: 'New Review Assigned!',
            message: `${moment().format('HH:mm')}`,
            open: 'https://review.udacity.com/#!/submissions/dashboard',
            icon: '../assets/clipboard.png',
            sound: 'Ping'
          })
          // Only request if max hasn't been assigned.
          if (count !== 2) { // Should be 2
            apiCall('create', '', body)
              .then(res => {
                requestId = res.body.id
                console.log(`The request ID is: ${requestId}`)
              })
          }
        } else if (count < assignedCount) {
          assignedCount--
          if (count === 1) { // Should be 1
            apiCall('create', '', body)
              .then(res => {
                requestId = res.body.id
                console.log(`The request ID is: ${requestId}`)
              })
          }
        }
      })
  }

  if (checkInterval(positionInterval)) {
    apiCall('position', requestId)
      .then(res => {
        positions = res.body
      })
  }

  if (checkInterval(refreshInterval)) {
    apiCall('refresh', requestId)
  }

  if (checkInterval(feedbacksInterval)) {
    apiCall('stats')
  }

  setTimeout(() => {
    tick++
    setPrompt()
    submissionRequests()
  }, tickrate)
}

function projectList () {
  let ids = cli.args.length ? cli.args : config.default_projects
  let projects = {
    projects: ids.map(id => {
      return {
        project_id: id,
        language: config.language
      }
    })
  }
  return projects
}

function setPrompt () {
  const uptime = startTime.fromNow(true)
  const tokenExpires = moment().dayOfYear(config.tokenAge).fromNow()

  // Clearing the screen
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)

  // Warnings
  console.log(chalk[tokenExpiryWarning() ? 'red' : 'green'](`Token expires ${tokenExpires}`))

  // Genral info
  console.log(chalk.green(`Uptime: ${chalk.white(uptime)}\n`))

  // Positions in queue
  console.log(chalk.blue('You are queued up for the following project(s):'))
  console.log(chalk.blue('===============================================\n'))

  positions.forEach(project => {
    console.log(chalk.blue(`    Project ${project.project_id} - ${config.certs[project.project_id]}`))
    console.log(chalk.yellow(`    Position in queue: ${chalk.white(project.position)}\n`))
  })

  console.log(chalk.blue('===============================================\n'))

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

// Make sure to catch the CTRL+C command to exit cleanly.
rl.on('SIGINT', () =>  {
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
})
