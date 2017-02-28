/* global test, expect */

import {api, config} from '../utils';


test('api call to "count" returns a number', async () => {
  const task = 'count';
  const token = config.token;
  const count = await api({token, task});
  const assignedCountObject = {
    body: {
      assigned_count: expect.any(Number),
    },
  };
  expect(count).toMatchObject(assignedCountObject);
});
