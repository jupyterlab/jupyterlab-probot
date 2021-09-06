import nock from "nock";
// Requiring our app implementation
import myProbotApp from "../src";
import { Probot, ProbotOctokit } from "probot";
// Requiring our fixtures
import duplicatePushes from './fixtures/duplicate_pushes.json';
import duplicatePRs from './fixtures/duplicate_pull_requests.json';
import openPREvent from './fixtures/pull_request.opened.json';

const fs = require("fs");
const path = require("path");

const privateKey = fs.readFileSync(
  path.join(__dirname, "fixtures/mock-cert.pem"),
  "utf-8"
);

describe("My Probot app", () => {
  let probot: any;

  beforeEach(() => {
    nock.disableNetConnect();
    probot = new Probot({
      appId: 123,
      privateKey,
      // disable request throttling and retries for testing
      Octokit: ProbotOctokit.defaults({
        retry: { enabled: false },
        throttle: { enabled: false },
      }),
    });
    // Load our app into probot
    probot.load(myProbotApp);
  });

  test('does not create a comment with a binder link', async () => {

    const config = {};
    const configBuffer = Buffer.from(JSON.stringify(config));

    const mock = nock("https://api.github.com")
      .persist()
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          actions: "write"
        },
      })

    .get("/repos/hiimbex/testing-things/contents/.github%2Fjupyterlab-probot.yml")
    .reply(200, configBuffer.toString())

    // Receive a webhook event
    await probot.receive({ name: "pull_request", payload: openPREvent });

    expect(mock.pendingMocks()).toStrictEqual([]);

  });

  test('creates a comment with a binder link', async () => {

    const config = { addBinderLink: true, binderUrlSuffix: 'foo' };
    const configBuffer = Buffer.from(JSON.stringify(config));

    const mock = nock("https://api.github.com")
      .persist()
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          actions: "write"
        },
      })

    .get("/repos/hiimbex/testing-things/contents/.github%2Fjupyterlab-probot.yml")
    .reply(200, configBuffer.toString())

    .post("/repos/hiimbex/testing-things/issues/36/comments")
    .reply(200)

    // Receive a webhook event
    await probot.receive({ name: "pull_request", payload: openPREvent });

    expect(mock.pendingMocks()).toStrictEqual([]);

  });

  test("cancels duplicate push runs", async () => {

    const mock = nock("https://api.github.com")
      .persist()
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          actions: "write"
        },
      })

      .get("/repos/hiimbex/testing-things/actions/workflows/8438617/runs?branch=hiimbex-patch-2&status=requested&event=push")
      .reply(200, duplicatePushes.requested_response)

      .get("/repos/hiimbex/testing-things/actions/workflows/8438617/runs?branch=hiimbex-patch-2&status=queued&event=push")
      .reply(200, duplicatePushes.queued_response)

      .get("/repos/hiimbex/testing-things/actions/workflows/8438617/runs?branch=hiimbex-patch-2&status=in_progress&event=push")
      .reply(200, duplicatePushes.in_progress_response)

      .post("/repos/hiimbex/testing-things/actions/runs/1179077215/cancel")
      .reply(202, {})


    // Receive a webhook event
    await probot.receive({ name: "workflow_run", payload: duplicatePushes.event });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("cancels duplicate pull_request runs", async () => {

    const mock = nock("https://api.github.com")
      .persist()
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          actions: "write"
        },
      })

      .get("/repos/hiimbex/testing-things/actions/workflows/8439041/runs?branch=hiimbex-patch-2&status=requested&event=pull_request")
      .reply(200, duplicatePRs.requested_response)

      .get("/repos/hiimbex/testing-things/actions/workflows/8439041/runs?branch=hiimbex-patch-2&status=queued&event=pull_request")
      .reply(200, duplicatePRs.queued_response)

      .get("/repos/hiimbex/testing-things/actions/workflows/8439041/runs?branch=hiimbex-patch-2&status=in_progress&event=pull_request")
      .reply(200, duplicatePRs.in_progress_response)

      .post("/repos/hiimbex/testing-things/actions/runs/1179072529/cancel")
      .reply(202, {})

      .post("/repos/hiimbex/testing-things/actions/runs/1179077219/cancel")
      .reply(202, {});

    // Receive a webhook event
    await probot.receive({ name: "workflow_run", payload: duplicatePRs.event });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  test("no-op when there are no duplicate pull_request runs", async () => {

    const mock = nock("https://api.github.com")
      .persist()
      .post("/app/installations/2/access_tokens")
      .reply(200, {
        token: "test",
        permissions: {
          actions: "write"
        },
      })

      .get("/repos/hiimbex/testing-things/actions/workflows/8439041/runs?branch=hiimbex-patch-2&status=requested&event=pull_request")
      .reply(200, duplicatePRs.requested_response)

      .get("/repos/hiimbex/testing-things/actions/workflows/8439041/runs?branch=hiimbex-patch-2&status=queued&event=pull_request")
      .reply(200, duplicatePRs.requested_response)

      .get("/repos/hiimbex/testing-things/actions/workflows/8439041/runs?branch=hiimbex-patch-2&status=in_progress&event=pull_request")
      .reply(200, duplicatePRs.requested_response)

    // Receive a webhook event
    await probot.receive({ name: "workflow_run", payload: duplicatePRs.event });

    expect(mock.pendingMocks()).toStrictEqual([]);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });
});
