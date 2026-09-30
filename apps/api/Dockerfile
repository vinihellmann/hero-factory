FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci

COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/api apps/api

RUN npm run build --workspace @hero-factory/contracts \
  && npm run build --workspace @hero-factory/api

FROM node:24-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci --omit=dev

COPY --from=build --chown=node:node /app/packages/contracts/dist packages/contracts/dist
COPY --from=build --chown=node:node /app/apps/api/dist apps/api/dist
COPY --from=build --chown=node:node /app/apps/api/prisma apps/api/prisma
COPY --from=build --chown=node:node /app/apps/api/prisma.config.ts apps/api/prisma.config.ts
COPY --from=build --chown=node:node /app/apps/api/src/database apps/api/src/database
COPY --from=build --chown=node:node /app/apps/api/src/generated apps/api/src/generated
COPY --chown=node:node apps/api/docker-entrypoint.sh apps/api/docker-entrypoint.sh

RUN chmod +x apps/api/docker-entrypoint.sh

USER node
EXPOSE 3333

ENTRYPOINT ["apps/api/docker-entrypoint.sh"]
