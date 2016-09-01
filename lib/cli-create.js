const cli = require('commander')
const config = require('../apiConfig')
const apiCall = require('./apiCall')

cli.parse(process.argv)

apiCall('create', '', projectList())
  .then(res => {
    console.log('Done')
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
