#!/bin/sh
set -eu

npm run db:migrate:deploy --workspace @hero-factory/api
npm run db:seed --workspace @hero-factory/api

exec node apps/api/dist/src/server.js
