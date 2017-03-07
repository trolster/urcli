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
    process.env.CONFIG = JSON.stringify(this);
  }
}

export const config = new Config();
