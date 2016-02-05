import { Schema, arrayOf, normalize } from 'normalizr';
import URLSearchParams from 'url-search-params';
import fetch from 'isomorphic-fetch';
import moment from 'moment-timezone';
import { deepMapValues } from 'lodash-deep';

// TODO read from config (tried earlier, but got very weird error)
const API_ROOT = 'http://localhost:3000/api';

function appendParamsToUrl(url, params) {
  if (params !== null && typeof params === 'object') {
    const qs = Object.keys(params)
      .reduce((p, key) => {
        p.append(key, params[key]);
        return p;
      }, new URLSearchParams())
      .toString();

    return `${url}?${qs}`;
  }

  return url;
}

// Fetches an API response and normalizes the result JSON according to schema.
// This makes every API response have the same shape, regardless of how nested it was.
function callApi(endpoint, config, params = null, schema, transformations) {
  const url = (endpoint.indexOf(API_ROOT) === -1)
    ? API_ROOT + endpoint
    : endpoint;

  const fullUrl = appendParamsToUrl(url, params);

  return fetch(fullUrl, config || {})
    .then(response =>
      response.json().then(json => ({ json, response }))
    ).then(({ json, response }) => {
      if (!response.ok) {
        return Promise.reject(json);
      } else if (json.error) {
        return Promise.reject(json.error);
      }

      const transformed = transformations ? transformations(json) : json;
      const normalized = schema ? normalize(transformed, schema) : transformed;

      return normalized;
    }).then(
      response => ({response}),
      error => ({error: error.message || 'Something bad happened'})
    );
}

function get(endpoint, params, schema, transformations) {
  return callApi(endpoint, {}, params, schema, transformations);
}

function put(endpoint, data, schema, transformations) {
  const config = {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };

  return callApi(endpoint, config, null, schema, transformations);
}

function post(endpoint, data, schema, transformations) {
  const config = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };

  return callApi(endpoint, config, null, schema, transformations);
}

function del(endpoint, schema, transformations) {
  const config = {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json'
    }
  };

  return callApi(endpoint, config, null, schema, transformations);
}

const makeDates = (timezone) => (json) => {
  return deepMapValues(json, (value, propertyPath) => {
    if (propertyPath.join('.').endsWith('Date')) {
      return moment.tz(value, timezone);
    }

    return value;
  });
};

const eventSchema = new Schema('events', {idAttribute: 'id'});
const eventsSchema = { events: arrayOf(eventSchema) };

// all previous requests should be canceled to prevent
export function fetchEvents(params) {
  const newParams = {
    startDate: params.startDate.toISOString(),
    endDate: params.endDate.toISOString(),
    timezone: params.timezone
  };

  return get('/events', newParams, eventsSchema, makeDates(params.timezone));
}

export function updateEvent(event, timezone) {
  const data = {...event, timezone: timezone};
  return put(`/events/${event.id}`, data, null, makeDates(timezone));
}

export function insertEvent(event, timezone) {
  const data = {...event, timezone: timezone};
  return post('/events', data, null, makeDates(timezone));
}

export function deleteEvent(id) {
  return del(`/events/${id}`);
}
