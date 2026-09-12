# frontend/Dockerfile
#
# Two stages: build the static bundle with Vite, then serve it with nginx.
# Nothing from the Node build stage (source, node_modules, Vite itself)
# ends up in the final image — only the compiled dist/ output.

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite inlines env vars into the bundle at BUILD time, not at container
# start time — there's no such thing as "runtime env vars" for a Vite app
# once it's compiled to static JS. Default is "" (same-origin, relative
# /api and /socket.io requests) so this image works correctly behind the
# nginx config below without any build arg needed; override at build time
# only if the API genuinely lives on a different origin than this container.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- serve ----
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD wget --quiet --spider http://127.0.0.1/ || exit 1
