const homedir = require('homedir')
const fs = require('fs')

const pathToConfigFile = `${homedir()}/.urcli_config.json`
const configDefaults = {
  token: '',
  tokenAge: '',
  certs: {},
  languages: [],
  pushbullet: ''
}

class Config {
  constructor () {
    try {
      let configFile = fs.readFileSync(pathToConfigFile)
      Object.assign(this, configFile)
    } catch (e) {
      if (e.code === 'ENOENT') {
        Object.assign(this, configDefaults)
        this.save()
      } else {
        throw e
      }
    }
  }

  save () {
    const configJSON = JSON.stringify({
      token: this.token,
      tokenAge: this.tokenAge,
      certs: this.certs,
      languages: this.languages,
      pushbullet: this.pushbullet
    }, null, 2)
    fs.writeFileSync(pathToConfigFile, configJSON)
    console.log('configuration saved:')
    console.log(configJSON)
  }
}

module.exports = new Config()
