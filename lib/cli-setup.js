const fs = require('fs')
const moment = require('moment')
const cli = require('commander')
const readline = require('readline');
const apiCall = require('./apiCall')

cli.parse(process.argv)

try {
  fs.unlinkSync('./apiConfig.json')
} catch (e) {
  // continue on error
}

// Add the token
const config = {
  certs: {},
  token: cli.args[0],
  tokenAge: moment().add(28, 'd'),
  languages: []
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Certified language > '
});

console.log('You can now add a all the languages that you are certified for.')
console.log('Simply type in each language code and separate them with a space.')
console.log('Example: "en-us pt-br"')
console.log('Type "done" when you are done.')
rl.prompt();

rl.on('line', (line) => {
  line.trim()
  line.toLowerCase()
  if (line === 'done') {
    rl.close()
    return
  }
  const lang = line.match(/[a-z]{2}-[a-z]{2}/gi)
  if (lang === null) {
    rl._prompt = 'Invalid language code(s). Try again (ex: "en-us") > '
    rl.prompt()
  } else {
    config.languages = lang
    console.log('You have entered the following language(s): ', lang)
    rl._prompt = 'Try again or type "done" > '
    rl.prompt()
  }
}).on('close', () => {
  // Get current certifications from the API
  apiCall('certifications')
  .then(res => {
    res.body
      .filter(c => c.status === 'certified')
      .forEach(c => {
        config.certs[c.project.id] = {
          name: c.project.name,
          price: c.project.price
        }
      })
    // Save the config file.
    fs.writeFileSync('./apiConfig.json', JSON.stringify(config, null, 2))
  })
});
