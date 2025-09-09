# Claude Code Configuration

This file contains project-specific configuration for Claude Code.

## General Workflow
When starting work on any project:
1. If on main branch, ask for JIRA ticket ID
2. Create branch with format: `TICKET-ID_short_description`
3. Example: `PT1-5021_setup_ci`

## Development Commands

### Build and Test
```bash
# Install dependencies
pnpm install

# Build the project
pnpm run build

# Run tests
pnpm run test

# Run linting
pnpm run lint

# Run in development mode
pnpm run start:dev
```

### Docker
```bash
# Build Docker image
docker build --no-cache -t 'practitest-migrator' -f ./misc/Dockerfile .

# Run Docker container
docker run -it --env-file='./.env.local' practitest-migrator
```

## Project Structure
- NestJS application for TestRail to PractiTest migration
- Uses TypeScript, SQLite, and Docker
- Multi-stage Docker build with Node.js 20 Alpine
- Package management with pnpm