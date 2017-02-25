/* global test, expect */

import apiCall from '../apiCall';
import config from '../config';

const token = config.token;

test('apiCall to "count" returns a number', async () => {
  const task = 'count';
  const count = await apiCall({token, task});
  const assignedCountObject = {
    body: {
      assigned_count: expect.any(Number),
    },
  };
  expect(count).toMatchObject(assignedCountObject);
});
