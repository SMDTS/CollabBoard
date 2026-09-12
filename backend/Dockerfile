# backend/Dockerfile
#
# Single stage is enough here — there's no build step, just installing
# production dependencies and running the server. (Compare frontend/Dockerfile,
# which needs a build stage because Vite bakes VITE_API_URL in at build time.)

FROM node:22-alpine

WORKDIR /app

# Copied separately from src/ so `npm ci` is only re-run when a dependency
# actually changes, not on every source edit — keeps rebuilds fast.
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
# Documentation only — Docker doesn't enforce this, and platforms like
# Render ignore it entirely (they inject their own PORT and expect the
# app to bind to that instead, which it does — see config.js). This value
# matches docker-compose.yml's local PORT for that context specifically.
EXPOSE 4000

# node:22-alpine already ships a non-root "node" user — no need to create one.
USER node

# Shell form (not exec-array form) so $PORT actually gets expanded here —
# the app binds to whatever process.env.PORT is at runtime (Render sets
# this to 10000 itself; docker-compose sets it to 4000 explicitly; falls
# back to 4000 to match config.js's own default if neither set it).
HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD wget --quiet --spider http://127.0.0.1:${PORT:-4000}/api/health || exit 1

CMD ["node", "src/server.js"]
