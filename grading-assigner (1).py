#!/usr/bin/env python
import signal
import sys
import argparse
import logging
import os
import requests
import time
import pytz
from dateutil import parser
from datetime import datetime, timedelta

utc = pytz.UTC

# Script config
BASE_URL = 'https://review-api.udacity.com/api/v1'
CERTS_URL = '{}/me/certifications.json'.format(BASE_URL)
ME_URL = '{}/me'.format(BASE_URL)
ME_REQUEST_URL = '{}/me/submission_requests.json'.format(BASE_URL)
CREATE_REQUEST_URL = '{}/submission_requests.json'.format(BASE_URL)
DELETE_URL_TMPL = '{}/submission_requests/{}.json'
GET_REQUEST_URL_TMPL = '{}/submission_requests/{}.json'
PUT_REQUEST_URL_TMPL = '{}/submission_requests/{}.json'
REFRESH_URL_TMPL = '{}/submission_requests/{}/refresh.json'
ASSIGNED_COUNT_URL = '{}/me/submissions/assigned_count.json'.format(BASE_URL)
ASSIGNED_URL = '{}/me/submissions/assigned.json'.format(BASE_URL)

REVIEW_URL = 'https://review.udacity.com/#!/submissions/{sid}'
REQUESTS_PER_SECOND = 1 # Please leave this alone.

logging.basicConfig(format='|%(asctime)s| %(message)s')
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

headers = None

def signal_handler(signal, frame):
    if headers:
        logger.info('Cleaning up active request')
        me_resp = requests.get(ME_REQUEST_URL, headers=headers)
        if me_resp.status_code == 200 and len(me_resp.json()) > 0:
            logger.info(DELETE_URL_TMPL.format(BASE_URL, me_resp.json()[0]['id']))
            del_resp = requests.delete(DELETE_URL_TMPL.format(BASE_URL, me_resp.json()[0]['id']),
                                       headers=headers)
            logger.info(del_resp)
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)

def alert_for_assignment(current_request, headers):
    if current_request and current_request['status'] == 'fulfilled':
        logger.info("")
        logger.info("=================================================")
        logger.info("You have been assigned to grade a new submission!")
        logger.info("View it here: " + REVIEW_URL.format(sid=current_request['submission_id']))
        logger.info("=================================================")
        logger.info("Continuing to poll...")
        return None
    return current_request

def wait_for_assign_eligible():
    while True:
        assigned_resp = requests.get(ASSIGNED_COUNT_URL, headers=headers)
        if assigned_resp.status_code == 404 or assigned_resp.json()['assigned_count'] < 2:
            break
        else:
            logger.info('Waiting for assigned submissions < 2')
        time.sleep(20.0)

def refresh_request(current_request):
    logger.info('Refreshing existing request')
    refresh_resp = requests.put(REFRESH_URL_TMPL.format(BASE_URL, current_request['id']),
                                headers=headers)
    refresh_resp.raise_for_status()
    if refresh_resp.status_code == 404:
        logger.info('No active request was found/refreshed.  Loop and either wait for < 2 to be assigned or immediately create')
        return None
    else:
        return refresh_resp.json()

def fetch_certified_pairs():
    logger.info("Requesting certifications...")
    me_resp = requests.get(ME_URL, headers=headers)
    me_resp.raise_for_status()
    languages = me_resp.json()['application']['languages'] or ['en-us']

    certs_resp = requests.get(CERTS_URL, headers=headers)
    certs_resp.raise_for_status()

    certs = certs_resp.json()
    project_ids = [cert['project']['id'] for cert in certs if cert['status'] == 'certified']

    logger.info("Found certifications for project IDs: %s in languages %s",
                str(project_ids), str(languages))
    logger.info("Polling for new submissions...")

    return [{'project_id': project_id, 'language': lang} for project_id in project_ids for lang in languages]

def request_reviews(token):
    global headers
    headers = {'Authorization': token, 'Content-Length': '0'}

    project_language_pairs = fetch_certified_pairs()
    logger.info("Will poll for projects/languages %s", str(project_language_pairs))

    me_req_resp = requests.get(ME_REQUEST_URL, headers=headers)
    current_request = me_req_resp.json()[0] if me_req_resp.status_code == 201 and len(me_req_resp.json()) > 0 else None
    if current_request:
        update_resp = requests.put(PUT_REQUEST_URL_TMPL.format(BASE_URL, current_request['id']),
                                   json={'projects': project_language_pairs}, headers=headers)
        current_request = update_resp.json() if update_resp.status_code == 200 else current_request

    while True:
        # Loop and wait until fewer than 2 reviews assigned, as creating
        # a request will fail
        wait_for_assign_eligible()

        if current_request is None:
            logger.info('Creating a request for ' + str(len(project_language_pairs)) +
                        ' possible project/language combinations')
            create_resp = requests.post(CREATE_REQUEST_URL,
                                        json={'projects': project_language_pairs},
                                        headers=headers)
            current_request = create_resp.json() if create_resp.status_code == 201 else None
        else:
            logger.info(current_request)
            closing_at = parser.parse(current_request['closed_at'])

            utcnow = datetime.utcnow()
            utcnow = utcnow.replace(tzinfo=pytz.utc)

            if closing_at < utcnow + timedelta(minutes=59):
                # Refreshing a request is more costly than just loading
                # and only needs to be done to ensure the request doesn't
                # expire (1 hour)
                logger.info('0-0-0-0-0-0-0-0-0-0- refreshing request 0-0-0-0-0-0-0')
                current_request = refresh_request(current_request)
            else:
                logger.info('Checking for new assignments')
                # If an assignment has been made since status was last checked,
                # the request record will no longer be 'fulfilled'
                url = GET_REQUEST_URL_TMPL.format(BASE_URL, current_request['id'])
                get_req_resp = requests.get(url, headers=headers)
                current_request = get_req_resp.json() if me_req_resp.status_code == 200 else None

        current_request = alert_for_assignment(current_request, headers)
        if current_request:
            time.sleep(10.0)

if __name__ == "__main__":
    cmd_parser = argparse.ArgumentParser(description =
      "Poll the Udacity reviews API to claim projects to review."
    )
    cmd_parser.add_argument('--auth-token', '-T', dest='token',
    metavar='TOKEN', type=str,
    action='store', default=os.environ.get('UDACITY_AUTH_TOKEN'),
    help="""
    Your Udacity auth token. To obtain, login to review.udacity.com, open the Javascript console, and copy the output of `JSON.parse(localStorage.currentUser).token`.  This can also be stored in the environment variable UDACITY_AUTH_TOKEN.
  """
    )
    cmd_parser.add_argument('--debug', '-d', action='store_true', help='Turn on debug statements.')
    args = cmd_parser.parse_args()

    if not args.token:
      cmd_parser.print_help()
      cmd_parser.exit()

    if args.debug:
        logger.setLevel(logging.DEBUG)

    request_reviews(args.token)

