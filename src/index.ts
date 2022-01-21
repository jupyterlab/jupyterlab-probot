
import Ajv, { JSONSchemaType } from 'ajv';

import * as fs from 'fs';

import { Context, Probot } from "probot";


/**
 * An interface used to capture workflow run data for processing.
 */
interface RunData {
  id: number;
}


/**
 * An interface for bot config data.  Should mirror the JSON schema.
 */
interface Config {
  binderUrlSuffix?: string;
  addBinderLink?: boolean;
  triageLabel?: string;
}


/**
 * Get the parsed config data given a probot context.
 */
async function getConfig(context: Context<any>): Promise<Config> {
  const config = await context.config('jupyterlab-probot.yml');
  if (!config) {
    return {};
  }
  const ajv = new Ajv({ useDefaults: true });
  const schema: JSONSchemaType<Config> = require('../schema.json');
  const validate = ajv.compile(schema);
  if (validate(config)) {
    return config;
  } else {
    console.log('\n--------------------------------');
    console.log('Config errors:')
    console.error(validate.errors);
    console.log('\n--------------------------------');
    return {};
  }
}


export = (app: Probot) => {

  /**
   * Add triage label to opened issues, if one is specified
   */
  app.on('issues.opened', async (context) => {
    const { payload } = context;
    const { issue } = payload;

    const config = await getConfig(context);
    const triageLabel = config['triageLabel'];

    if (triageLabel === undefined) {
      return;
    }

    if (!(issue.labels ?? []).map((label) => label.name).includes(triageLabel)) {
      await context.octokit.issues.addLabels(
        context.issue({ labels: [triageLabel] })
      );
    }
  });

  app.on('pull_request.opened', async (context) => {
    const head = context.payload.pull_request.head;
    const ref = encodeURIComponent(head.ref);
    const user = head.user.login;
    const repo = head.repo.name;

    let urlSuffix = ''
    const config = await getConfig(context);
    if (config.binderUrlSuffix) {
      urlSuffix = config.binderUrlSuffix;
    }
    console.log('\n--------------------------------');
    console.log('Handling Pull Request Opened:');
    console.log(`    repo: ${user}/${repo}`);
    console.log(`    ref: ${ref}`);
    console.log(`    config:`);
    console.log(config);
    if (!config.addBinderLink) {
      console.log(`Skipping binder link for ${repo}`);
      console.log('--------------------------------\n')
      return;
    }
    const link = `https://mybinder.org/v2/gh/${user}/${repo}/${ref}${urlSuffix}`;
    console.log(`Making binder link for ${repo}`);
    console.log(link);
    console.log('--------------------------------\n')
    const comment = `Thanks for making a pull request to ${repo}!
To try out this branch on [binder](https://mybinder.org), follow this link: [![Binder](https://mybinder.org/badge_logo.svg)](${link})`
    const issueComment = context.issue({ body: comment });
    await context.octokit.issues.createComment(issueComment);
  });

  app.on("workflow_run.requested", async (context) => {
    const run = context.payload.workflow_run;
    /* istanbul ignore if */
    if (!run?.workflow_id) {
      return;
    }
    const event_type = run.event;
    const branch = run.head_branch;
    const workflow_id = run.workflow_id;
    const repository = context.payload.repository;
    const owner = repository.owner.login;
    const repo = repository.name;
    const duplicates: RunData[] = [];
    const messages: string[] = [];

    if (event_type === "workflow_dispatch") {
      console.log('\n--------------------------------');
      console.log('Ignoring workflow_dispatch run');
      console.log('--------------------------------\n');
      return;
    }

    if (process.env.DEBUG == 'true') {
      fs.writeFileSync("outputs.txt", "\n\n" + JSON.stringify(context.payload) + "\n", { flag: "a" });
    }

    const statuses = ["queued", "in_progress", "requested"];
    await Promise.all(statuses.map(async (status) => {
      const resp = await context.octokit.rest.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id,
        branch,
        status: status as "queued",
        event: event_type
      });
      /* istanbul ignore if */
      if (resp.status !== 200) {
        messages.push(String(resp));
        return;
      }
      if (process.env.DEBUG == 'true') {
        fs.writeFileSync("outputs.txt", JSON.stringify(resp) + "\n", { flag: "a" });
      }
      let runs = resp.data.workflow_runs.map(run => {
        return {
          id: run.id
        }
      });
      // Make sure the triggered run is not listed
      runs = runs.filter(data => data.id !== run.id);
      duplicates.push(...runs);
    }));

    if (duplicates.length == 0) {
      messages.push('No duplicate runs found!');
    }

    await Promise.all(duplicates.map(async (duplicate) => {
      const run_id = duplicate.id;
      messages.push(`Canceling run ${run_id}`);
      const resp = await context.octokit.rest.actions.cancelWorkflowRun({
        owner,
        repo,
        run_id
      });
      if (process.env.DEBUG == 'true') {
        fs.writeFileSync("outputs.txt", JSON.stringify(resp) + "\n", { flag: "a" });
      }
      /* istanbul ignore if */
      if (resp.status !== 202) {
        messages.push(String(resp));
      }
    }));

    console.log('\n--------------------------------');
    console.log('Checking for duplicate runs:');
    console.log(`    repo: ${owner}/${repo}`);
    console.log(`    branch: ${branch}`);
    console.log(`    workflow: ${(run as any)?.name}`);
    console.log(`    event_type: ${event_type}`)
    messages.forEach(message => console.log(message));
    console.log("Finished handling duplicate runs")
    console.log('--------------------------------\n')
  });

};
