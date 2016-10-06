const fs = require('fs')
const path = require('path')
const moment = require('moment')
const cli = require('commander')
const apiCall = require('./apiCall')

cli.parse(process.argv)

apiCall('completed')
.then(res => {
  fs.writeFileSync(
    path.resolve('./submissions.json'), JSON.stringify(res.body, null, 2))
})
