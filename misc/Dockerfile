FROM node:20-alpine as builder
WORKDIR /app

RUN npm install -g pnpm

COPY . /app/

RUN pnpm install --frozen-lockfile
RUN pnpm run build

FROM node:20-alpine as runner
WORKDIR /app
RUN apk add --no-cache bash

COPY --from=builder ["/app/dist", "/app/.env.example", "/app/package.json", "/app/pnpm-lock.yaml", "/app/"]
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

CMD ["/bin/sh", "-c", "cd /app/ && node /app/main"]
