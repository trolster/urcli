/* global jest, test, expect */
import cli from '../cli';

jest.mock('../utils/config');

test('token something', () => {
  cli.parse(['babel-node', 'src', 'token', 'tokenTest']);

  const output = JSON.parse(process.env.CONFIG).token;
  const configObject = 'tokenTest';
  expect(output).toBe(configObject);
});
