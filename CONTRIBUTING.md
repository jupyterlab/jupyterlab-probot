## Contributing

## General Jupyter contributor guidelines

If you're reading this section, you're probably interested in contributing to
Jupyter.  Welcome and thanks for your interest in contributing!

Please take a look at the Contributor documentation, familiarize yourself with
using the Jupyter Server, and introduce yourself on the mailing list and
share what area of the project you are interested in working on.

For general documentation about contributing to Jupyter projects, see the
[Project Jupyter Contributor Documentation](https://jupyter.readthedocs.io/en/latest/contributing/content-contributor.html)


## Adding Fixtures

Trigger the events on GitHub
Save the event and response locally.
Run the event against the locally running server.
Save a stripped version to the `test/fixtures` folder.
Set the "installation" value of the event to 2 for consistency.
Write the tests.


```bash
node_modules/.bin/probot receive -e workflow_run -p test/fixtures/workflow_runs.requested.pull_request.json ./lib/index.js
node_modules/.bin/probot receive -e workflow_run -p test/fixtures/workflow_runs.requested.push.json ./lib/index.js
```
