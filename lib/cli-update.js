const cli = require('commander')
const apiCall = require('./apiCall')
const config = require('../apiConfig')
const winston = require('winston')

winston.add(winston.transports.File, { filename: 'somefile.log' })

cli.parse(process.argv)

apiCall('get')
  .then(res => {
    let id = res.body[0].id
    apiCall('update', id, projectList())
      .then(res => {
        winston.log('info', 'hello from winston..')
        console.log('Updated..')
      })
  })

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
  console.log(projects)
  return projects
}
