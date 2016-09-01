const cli = require('commander')
const apiCall = require('./apiCall')

cli.parse(process.argv)

apiCall('get')
  .then(res => {
    let id = res.body[0].id
    apiCall('update', id, projectList())
      .then(res => {
        console.log('Deleted..')
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
