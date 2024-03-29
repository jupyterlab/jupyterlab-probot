# jupyterlab-probot

> A GitHub App built with [Probot](https://github.com/probot/probot) that A Probot app for JupyterLab Maintenance

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Docker

```sh
# 1. Build container
docker build -t jupyterlab-probot .

# 2. Start container
docker run -e APP_ID=<app-id> -e PRIVATE_KEY=<pem-value> jupyterlab-probot
```

## Configuration

Create a `.github/jupyterlab-probot.yml` in the target repository.

Example:

```yaml
addBinderLink: true
binderUrlSuffix: "?urlpath=lab-dev"
triageLabel: "status:Needs Triage"
botUser: "my-bot-name"
```

## Bot Usage

By default, the `botUser` is `jupyterlab-bot`.  If you use a different `botUser`, replace it below.


### Close and reopen an issue or pull request.

`@jupyterlab-bot, please restart ci`

## Deploying

See heroku instructions from [probot](https://probot.github.io/docs/deployment/#heroku).

```bash
git push heroku main
heroku config:set LOG_LEVEL=trace
heroku logs --tail
```

## Contributing

If you have suggestions for how jupyterlab-probot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

