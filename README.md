Calendar
========

A calendar / scheduler that uses [React](https://facebook.github.io/react/).

Incomplete.  Not production ready.  Just testing out some ideas.  Likely many
bugs.

I'm in the process of moving and won't have much time for this project.  Just
wanted to get it out there.

Screenshot
----------

![Screenshot](http://i.imgur.com/HyLbb9Y.gif)

Getting Started
---------------

Start MongoDB and seed it (creates a calendar db):

```shell
$ npm run seed
```

Clone, then npm install and start.

```shell
$ npm install
$ npm start
```

Without DevTools in dev

```shell
$ npm run dev:no-debug
```

Navigate to http://localhost:3000/

Backend
-----------------

Comes bundled with a basic web service for managing calendar events in a MongoDB
store, served on /api/events.

See the following files for more info:

```
server/controllers/api/events.js
server/models/events.js
```

Notes
-----------------

Only monthly view is currently implemented.

Uses momentjs for dates, which performs mutable operations.  Careful.

Events get loaded into the scheduler.events.events store and are never removed.
Could be a problem for a lot of events.

Need to add Auth.

Currently shows up blank on the iPad.

Built on top of [React Redux Starter Kit](https://github.com/davezuko/react-redux-starter-kit).

Implementation Requirements
---------------------------

Optimistic writes

- Updating a date (add new, edit, or drag to new time) should update the UI
  immediately, so that it positions the event with a saving indicator, sends an
  update request to the backend, and then uses that backend response to update
  the (internal state and) UI once more.

Timezone support

- All-day events are stored in the backend as UTC with a start and end datetime
  of 00:00:00 and 23:59:59 in UTC.
- These dates get returned back to the client with a start and end datetime of
  00:00:00 and 23:59:59 in the timezone that was requested to the server.

Cancel http requests

- If you click 'next month' really fast, it should only process the (events)
  data fetch for the last request to fulfill. 

Future
------

Instead of bootstrap, use something similar to [Elemental
UI](https://github.com/elementalui/elemental) instad of bootstrap.

- https://github.com/elementalui/elemental/issues/53
- https://github.com/nikgraf/future-react-ui/issues/1
