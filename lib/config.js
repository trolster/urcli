// node modules
const fs = require('fs')
// project dependencies
const homedir = require('homedir')
const configFilePath = `${homedir()}/.urcli_config.json`

class Config {
  constructor () {
    try {
      const config = JSON.parse(fs.readFileSync(configFilePath))
      Object.assign(this, config)
    } catch (e) {
      if (e.code !== 'ENOENT') {
        console.error('Error reading from filesystem.')
        throw new Error(e)
      }
    }
  }
  save () {
    const config = JSON.stringify(this, null, 2)
    try {
      fs.writeFileSync(configFilePath, config)
    } catch (e) {
      console.error('Unable to save the config file.')
      throw new Error(e)
    }
    console.log('configuration saved:')
    console.log(config)
  }
}

module.exports = new Config()
