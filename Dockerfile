# Builds the client and server, then runs the server, which also serves the client.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY client/package.json client/
COPY server/package.json server/
RUN npm ci
COPY . .
# Vite bakes this into the client bundle, so it's needed at build time
ARG VITE_SPOTIFY_CLIENT_ID
RUN test -n "$VITE_SPOTIFY_CLIENT_ID" || (echo 'Set VITE_SPOTIFY_CLIENT_ID (see .env.example)' && exit 1)
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY client/package.json client/
COPY server/package.json server/
# Only the server's runtime dependencies; shared is types only and the client is prebuilt
RUN npm ci --omit=dev -w server && npm cache clean --force
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/client/dist client/dist
USER node
EXPOSE 5050
CMD ["node", "server/dist/index.js"]
