const fs = require('fs')
const path = require('path')
const cli = require('commander')
const apiCall = require('./apiCall')
const config = require('../apiConfig')

cli.parse(process.argv)

// Get current certifications from the API
apiCall('certifications')
  .then(res => {
    res.body.filter(c => c.status === 'certified')
      .forEach(c => {
        config.certs[c.project_id.toString()] = c.project.name
      })
    // Save the config file.
    fs.writeFileSync(
      path.resolve('./apiConfig.json'), JSON.stringify(config, null, 2))
  })
