# PractiTest Migration Tool

This project was generated using [Nest CLI](https://nestjs.com).

## Docker
### Build locally
```shell
docker build --no-cache -t 'practitest-migrator' -f ./misc/Dockerfile .
```
### Run docker image
```shell
docker run -it --env-file='./.env.local' practitest-migrator
```

### Passing environment variables
You can use any variable listed in the corresponding section of this
documentation by passing it as a part of run command.

#### Example
```shell
docker run -it --env=LOGGING_LEVEL=verbose practitest-migrator
```

### Volumes
To make the app persist state between subsequent runs, provide the `docker run`
command with volumes mapping.

#### Available paths
- `/app/db` - default path to the application database. Can be changed by passing `DATABASE_DIR` environment variable

#### Volumes usage example on windows
When running docker container on windows, make sure you specify volume using Windows-style path semantics.
```shell
docker run -it -v h:\dockercache:/app/db practitest-migrator
```
### Running prebuild image
The application has a prebuilt version stored in a registry.

Image: `git.xxx.org:4567/practitest-migration-tool:release-<version>`

#### Example:
```shell
docker login git.xxx.org:4567 -u <username> -p <token>

docker run -it git.xxx.org:4567/practitest-migration-tool:release-0.0.1
```

If you have credentials, then you can run the build image by executing the

### Backend
- [Backend naming conventions](misc/instructions/backend-naming-conventions.md)
- [Exceptions handling](misc/instructions/exceptions-handling.md)
- [Logging](misc/instructions/logging.md)
- [Working with database layer](misc/instructions/working-with-database-layer.md)

Before starting working on the project, it's highly recommended to go through all the articles.
**If any part seem controversial, feel free to discuss it with the project team-lead**

<hr>

## Automation
The repository has a few automated tasks configured.
They are managed with `husky` and technically are a set of git-hooks, that are placed at `/.husky` and should be installed automatically after the very first packages installation.

**Please, make sure hooks were installed properly. The most common problems are described in the [official FAQ](https://typicode.github.io/husky/#/?id=faq)**

## Branches naming
Branches should always contain a number of a task from the management tool, so it can be identified and
mapped with the original cause of its creation. The common rule is, the branch should be easily identifiable,
but at the same time as short as possible.

It can be simple pattern like `PMT-1`. It's a recommended approach as type of task, and all the additional context
can be found in task management system and commits messages.

It'a allowed to add an optional description of what is about to be done: `PMT-1-short-description`. But this approach
is more suitable for rare cases when task identifier isn't enough

## Commits naming
We have a `commit-lint` package, that verifies each and every package name with a set of rules described in `/commitlint.config.js`.

To pass the validation, your commit message should at least follow these few rules:
- The simplest commit message has to contain task name, and a message:
```
PMT-1: test
```
- In most cases, it would be ver helpful, if you include a commit type info as well:
```
[FIX] PMT-1: test
```
- Even better, if your commit contains it's scope (which is usually helpful when testing the app):
```
[FIX] [Dashboard] PMT-1: test
```
- If you want to add extra details to your commit, it's always allowed and welcomed. Just add an empty line after the commit message, and write the body below:
```
[FIX] [Dashboard] PMT-1: test

Body message
```

*If for some reason, you want to bypass the message verification, you can run commit message without hooks (`git commit --no-verify`). But in this case, you are the one responsible for it, so should have a strict reasoning behind it.*

## Environment variables
The default application variables are stored in the `.env` file. Values should not be related to
any production environment, and can be changed only in case when you want to make them
available to everybody.

If you add any custom environment variable, it has to be defined in `.env` file.

`.env` files are tracked by VCS. If you add any environment variable, please make sure, it's pushed, so all the members are aware of it

`.env.local` is the way to override any variable (e.g. database connection options) locally.
**It's totally ignored by VCS and docker.**

| Name                       |        Default        | Description                                                                                                                                                                                                                                                                                                                                          |
|----------------------------|:---------------------:|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `LOGGING_PREFER_JSON`      |        `false`        | `true` - format logs as json objects <br>`false` - easy to read formatting                                                                                                                                                                                                                                                                           |
| `LOGGING_WRITE_TO_FILE`    |        `false`        | `true` - write logs to file                                                                                                                                                                                                                                                                                                                          |
| `LOGGING_FILES_DIR`        |      `'./logs'`       | Directory to write log files. Used if `LOGGING_WRITE_TO_FILE` is set to `true`                                                                                                                                                                                                                                                                       |
| `LOGGING_LEVEL`            |        `info`         | `error` - capture only critical errors. <br>`warn` - highlight warnings<br>`info` - log basic migration information<br>`verbose` - provide detailed logs, including URI and HTTP request/response statuses<br>`debug` - detailed information about requests (request params and body)<br><br>Each log level includes the logs from preceding levels. |
| `DATABASE_DIR`             | `'./db/tr-pt.sqlite'` | Path to sqlite database file to store migration data (file is created automatically)                                                                                                                                                                                                                                                                 |
| `NODE_ENV`                 |     `development`     | `development` - used for development purposes<br>`production` - used for production environment                                                                                                                                                                                                                                                      |
| `TESTRAIL_BASE_URL`        |           —           | TestRail instance url without trailing slash. Example: `https://yourproject.testrail.io`                                                                                                                                                                                                                                                             |
| `TESTRAIL_USERNAME`        |           —           | TestRail admin user email                                                                                                                                                                                                                                                                                                                            |
| `TESTRAIL_API_KEY`         |           —           | TestRail API Key (can be generated at `My Settings > API KEYS`). [Details](https://support.testrail.com/hc/en-us/articles/7077039051284-Accessing-the-TestRail-API)                                                                                                                                                                                  |
| `TESTRAIL_API_LIMIT`       |         `180`         | TestRail requests per minute limit                                                                                                                                                                                                                                                                                                                   |
| `PRACTITEST_BASE_URL`      |           —           | PractiTest api url without trailing slash. Example: `https://api.practitest.com`                                                                                                                                                                                                                                                                     |
| `PRACTITEST_USERNAME`      |           —           | Practitest admin user mail                                                                                                                                                                                                                                                                                                                           |
| `PRACTITEST_API_KEY`       |           —           | PractiTest API Key. [Details](https://www.practitest.com/help/automation-integration/api/#api-tokens)                                                                                                                                                                                                                                                |
| `PRACTITEST_API_LIMIT`     |         `100`         | PractiTest requests per minute limit                                                                                                                                                                                                                                                                                                                 |
| `ENABLE_CHUNKED_PUSH`      |        `false`        | `true` - allow multiple push requests to be executed simultaneously<br>`false` - execute only one request at a time                                                                                                                                                                                                                                  |
| `ENABLE_BULK_CHUNKED_PUSH` |        `false`        | `true` - allow multiple bulk push requests to be executed simultaneously<br>`false` - execute only one bulk request at a time<br>Works only if `ENABLE_CHUNKED_PUSH` is set to `true`.                                                                                                                                                               |
| `FALLBACK_USER_EMAIL`      |           —           | Email of the fallback user, that will be created in PractiTest.<br>Don't use users from the `practitest.com` domain.                                                                                                                                                                                                                                 |
| `MIGRATE_USERS`            |        `true`         | `false` - disable migration of users and all dependent entities                                                                                                                                                                                                                                                                                      |
| `MIGRATE_CASES`            |        `true`         | `false` - disable migration of cases and all dependent entities                                                                                                                                                                                                                                                                                      |
| `MIGRATE_RUNS`             |        `true`         | `false` - disable migration of runs and all dependent entities                                                                                                                                                                                                                                                                                       |
| `MIGRATE_TESTS`            |        `true`         | `false` - disable migration of tests and all dependent entities                                                                                                                                                                                                                                                                                      |
| `MIGRATE_RESULTS`          |        `true`         | `false` - disable migration of results and all dependent entities                                                                                                                                                                                                                                                                                    |
| `MIGRATE_ATTACHMENTS`      |        `true`         | `false` - disable migration of attachments                                                                                                                                                                                                                                                                                                           |
| `BATCH_SIZE`               |         `500`         | The number of entities that will be migrated in one batch                                                                                                                                                                                                                                                                                            |


## Prerequisites
1. `NodeJS` v.20+
2. `pnpm` installed

## Steps to launch the app
1. Clone the repository
2. Install all the dependencies with `pnpm install`
3. Set up environment variables
4. Prepare your TestRail and PractiTest projects. ([Guide](misc/instructions/migration-preparation.md))
5. Run with `pnpm start`
