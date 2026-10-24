# Stage 1: Build Frontend PWA
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Runtime (Express 5 + node:sqlite WAL)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5001
ENV DB_DIR=/app/data

# Create persistent directory for anchor.db, anchor.db-wal, and anchor.db-shm
RUN mkdir -p /app/data && chown -R node:node /app/data

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY ./server ./server

USER node
VOLUME ["/app/data"]
EXPOSE 5001

CMD ["node", "--experimental-sqlite", "server/index.js"]
