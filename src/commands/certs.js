// npm modules
import ora from 'ora';
import Table from 'cli-table2';
// our modules
import {config, getCerts} from '../utils';

async function certsCmd() {
  const certSpinner = ora('Getting certifications...').start();
  await getCerts();

  // Create a table layout for presenting the certifications.
  const certsDetails = new Table({
    head: [
      {hAlign: 'center', content: 'id'},
      {hAlign: 'left', content: 'project name'},
      {hAlign: 'center', content: 'price'}],
    colWidths: [5, 40, 7],
  });
  Object.keys(config.certs)
    .sort((a, b) => a - b)
    .forEach((id) => {
      const {name, price} = config.certs[id];
      certsDetails.push([
        {hAlign: 'center', content: id},
        {hAlign: 'left', content: name},
        {hAlign: 'center', content: price},
      ]);
    });

  certSpinner.succeed(`Certifications saved:\n${certsDetails.toString()}`);
  process.exit(0);
}

export default certsCmd;
