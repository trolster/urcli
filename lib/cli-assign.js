const readline = require('readline')
const moment = require('moment')
const notifier = require('node-notifier')
const chalk = require('chalk')
const cli = require('commander')
const config = require('../apiConfig')
const apiCall = require('./apiCall')

cli.parse(process.argv)

const startTime = moment()
const tickrate = 10000
let tick = 0

let assignedCount = 0
let assignedTotal = 0

let body = projectList()
let positions = []

let requestId = 0

// Intervals in 10 second increments.
const countInterval = 1
const positionInterval = 6
const refreshInterval = 30
const feedbacksInterval = 30

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
            })
          submissionRequests()
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
    console.log('Refreshing...')
  }

  if (checkInterval(feedbacksInterval)) {
    apiCall('stats')
      .then(res => {
        console.log(res.body)
      })
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

  // Clearing the screen
  readline.cursorTo(process.stdout, 0, 0)
  readline.clearScreenDown(process.stdout)

  // Warnings
  if (tokenExpiryWarning()) {
    console.log(chalk.red(`Token expires ${moment().dayOfYear(config.tokenAge).fromNow()}`))
  }

  // Genral info
  console.log(chalk.green(`Uptime: ${chalk.white(uptime)}\n`))

  console.log('===============================================')
  console.log('You are queued up for the following project(s):\n')
  // Positions in queue
  positions.forEach(project => {
    console.log(chalk.blue(`-> Project ${project.project_id}`))
    console.log(`   Position in queue: ${chalk.white(project.position)}\n`)
  })

  // Display number of assigned
  console.log(chalk.green(
    `Currently assigned: ${chalk.white(assignedCount)}`))

  // Total number of reviews assigned this session
  console.log(chalk.green(
    `Total assigned: ${chalk.white(assignedTotal)} since ${startTime.format('dddd, MMMM Do YYYY, HH:mm')}`))
  process.stdout.write(chalk.white('\n'))
}
