# syntax=docker/dockerfile:1
# Dockerfile del backend CommerCity (multi-stage).
# Contexto de build: la RAIZ del repositorio (ver docker-compose.yml).
#
# Uso manual:
#   docker build -t commercity-api .
#   docker run --env-file backend/.env -p 3000:3000 commercity-api
#
# Nota E-4: el HEALTHCHECK usa GET /health, endpoint implementado en
# backend/src/server/app.js (TASK-8.4) y documentado en OpenAPI.

FROM node:22-slim AS dependencias
WORKDIR /app
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=dependencias /app/node_modules ./node_modules
COPY backend/package.json ./
COPY backend/src ./src
# La app escribe las imagenes subidas en src/server/uploads: el usuario sin
# privilegios del contenedor necesita el directorio propio.
RUN mkdir -p src/server/uploads && chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "src/server/server.js"]
