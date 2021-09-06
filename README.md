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

```json
{
    "useBinderLink": true,
    "binderUrlSuffix": "?urlpath=lab-dev"
}
```

## Contributing

If you have suggestions for how jupyterlab-probot could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

