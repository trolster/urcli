const path = require('path')
const fs = require('fs')
const moment = require('moment')
const cli = require('commander')
const readline = require('readline')

cli.parse(process.argv)

if (!cli.args[0]) throw new Error('You must enter a token (use quotes)')

// Add the token
const config = {
  certs: {},
  token: cli.args[0],
  tokenAge: moment().add(28, 'd'),
  languages: []
}

// Start by creating the apiConfig file
const configPath = path.join(__dirname, '../apiConfig.json')
try {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
} catch (e) {
  throw new Error('Unable to create apiConfig', e)
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Certified language > '
});

console.log('You can now add all the languages that you are certified for.')
console.log('Simply type in each language code and separate them with a space.')
console.log('Example: "en-us pt-br"')
console.log('Type "done" when you are done.')
rl.prompt();

rl.on('line', (line) => {
  line.trim()
  line.toLowerCase()
  if (line === 'y') {
    rl.close()
    return
  }
  const lang = line.match(/[a-z]{2}-[a-z]{2}/gi)
  if (lang === null) {
    rl._prompt = line === 'n' ? 'Try again (ex: "en-us pt-br") > ' :
                                'Invalid language code(s). Try again (ex: "en-us pt-br") > '
    rl.prompt()
  } else {
    config.languages = lang
    console.log('You have entered the following language(s): ', lang)
    rl._prompt = 'Was this correct? (y/n) > '
    rl.prompt()
  }
}).on('close', () => {
  // Get current certifications from the API
  require('./apiCall')('certifications')
  .then(res => {
    res.body
      .filter(c => c.status === 'certified')
      .forEach(c => {
        config.certs[c.project.id] = {
          name: c.project.name,
          price: c.project.price
        }
      })
    // Save the config file
    const configJSON = JSON.stringify(config, null, 2)
    fs.writeFileSync(configPath, configJSON)
    console.log('configuration saved:')
    console.log(configJSON)
  })
});
