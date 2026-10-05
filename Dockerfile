# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile = a recipe for building an IMAGE (a packaged app + everything it
# needs to run). Running an image gives you a CONTAINER.
#
# This is a "multi-stage" build:
#   Stage 1 (build):   has TypeScript + dev tools, compiles src/ → dist/
#   Stage 2 (runtime): copies only dist/ + production packages → small image
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: build ───────────────────────────────────────────────────────────
# Start FROM an official image that already has Node.js 22 installed.
# "alpine" = a tiny Linux distribution, so the image stays small.
FROM node:22-alpine AS build

# All following commands run inside this folder in the image.
WORKDIR /app

# Copy ONLY the package files first, then install.
# Why? Docker caches each step ("layer"). If package*.json didn't change,
# the slow npm ci step is reused from cache even when your code changes.
COPY package.json package-lock.json ./
RUN npm ci

# Now copy the source code and compile TypeScript → dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
# Start again from a clean Node image. Nothing from stage 1 comes along
# unless we explicitly COPY it — so no TypeScript, no tests, no dev tools.
FROM node:22-alpine

WORKDIR /app

# Tell Node (and libraries like Express) we are in production mode.
ENV NODE_ENV=production

# Install production dependencies only (express) — skips typescript, vitest, eslint...
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Take the compiled JavaScript from the build stage.
COPY --from=build /app/dist ./dist

# Security: don't run as root. The node image ships with a user called "node".
USER node

# Documentation: the app listens on port 3000 inside the container.
EXPOSE 3000

# Docker checks every 30s that the app responds; the container is marked
# "healthy" or "unhealthy". Uses our /api/health endpoint.
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/api/health || exit 1

# The command that runs when the container starts.
CMD ["node", "dist/server.js"]
