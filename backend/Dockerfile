# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace root
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/

# Install all dependencies
RUN npm ci --workspace=@skillsnap/shared --workspace=@skillsnap/backend

# Copy source
COPY shared/ shared/
COPY backend/ backend/

# Build shared first, then backend
RUN npm run build --workspace=@skillsnap/shared 2>/dev/null || true
RUN cd backend && npx tsc

# Copy schema.sql to dist
RUN mkdir -p backend/dist/db && cp backend/src/db/schema.sql backend/dist/db/

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy package files and install production deps only
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY backend/package.json backend/

RUN npm ci --production --workspace=@skillsnap/shared --workspace=@skillsnap/backend

# Copy built files
COPY --from=builder /app/backend/dist backend/dist
COPY --from=builder /app/shared shared/

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "backend/dist/index.js"]
