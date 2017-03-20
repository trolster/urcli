// node modules
import fs from 'fs';
// npm modules
import homedir from 'homedir';

const configFilePath = `${homedir()}/.urcli/config.json`;

export class Config {
  constructor() {
    try {
      const config = JSON.parse(fs.readFileSync(configFilePath));
      Object.assign(this, config);
    } catch (e) {
      // We can ignore ENOENT and throw on everything else.
      if (e.code !== 'ENOENT') {
        console.error('Error reading from filesystem.');
        throw new Error(e);
      }
    }
  }
  save(configValues) {
    Object.assign(this, configValues);
    const config = JSON.stringify(this, null, 2);
    try {
      fs.writeFileSync(configFilePath, config);
    } catch (e) {
      // We can create both the config folder and file on ENOENT and throw on
      // everything else.
      if (e.code !== 'ENOENT') {
        console.error('Error while saving the config file.');
        throw new Error(e);
      }
      fs.mkdirSync(`${homedir()}/.urcli`);
      fs.writeFileSync(configFilePath, config);
    }
    return this;
  }
}
