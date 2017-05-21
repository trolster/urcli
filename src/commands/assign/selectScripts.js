// node modules
import fs from 'fs';
import readline from 'readline';
// npm modules
import inquirer from 'inquirer';
// our modules
import {config} from '../../utils';

function validatePath(userPath) {
  try {
    return fs.statSync(userPath).isFile();
  } catch (e) {
    // Check exception. If ENOENT - no such file or directory ok, file doesn't exist.
    // Otherwise something else went wrong, we don't have rights to access the file, ...
    if (e.code !== 'ENOENT') {
      throw e;
    }
    return 'File does not exist. Please enter a valid path.';
  }
}

async function selectScripts() {
  const certifications = Object.keys(config.certs)
    .map(cert => ({
      name: config.certs[cert].name,
      checked: false,
      value: cert,
    }));

  const choices = [new inquirer.Separator('\nConfigure scripts for the following projects:')]
    .concat(certifications);

  // Clearing the screen.
  readline.cursorTo(process.stdout, 0, 0);
  readline.clearScreenDown(process.stdout);

  const selections = await inquirer.prompt([{
    type: 'checkbox',
    message: 'Select option(s) to toggle ON/OFF:\n',
    name: 'projectIds',
    choices,
    pageSize: 15,
  }]);
  const questions = selections.projectIds
    .map(id => ({
      type: 'input',
      name: id,
      message: `Input script path for project ${id}`,
      validate: validatePath,
    }));
  const answers = await inquirer.prompt(questions);
  return answers;
}

export default selectScripts;
