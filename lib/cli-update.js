const cli = require('commander')
const apiCall = require('./apiCall')
const config = require('../apiConfig')

cli
  .arguments('<ids...>')
  .action((ids) => {
    let projects = {
      projects: ids.map(id => {
        return {
          project_id: id,
          language: config.language
        }
      })
    }
    // TODO: Validation...
    apiCall('get')
    .then(res => {
      let id = res.body[0].id
      apiCall('update', id, projects)
    })
  })
  .parse(process.argv)
