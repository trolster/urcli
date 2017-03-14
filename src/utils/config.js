// node modules
import fs from 'fs';
// npm modules
import homedir from 'homedir';
// homedir() is a cross platform way of getting the users home directory.
// On macOS it would end up being '/Users/username/.urcli_config.json'.
const configFilePath = `${homedir()}/.urcli_config.json`;

class Config {
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
      console.error('Unable to save the config file.');
      throw new Error(e);
    }
    console.log('configuration saved:');
    console.log(config);
    return Promise.resolve();
  }
}

export const config = new Config();
