FROM node:22-slim
WORKDIR /app
COPY package*.json ./
COPY shared/package*.json ./shared/
COPY backend/package*.json ./backend/
RUN npm ci --workspace=backend --workspace=shared
COPY shared/ ./shared/
COPY backend/ ./backend/
RUN npm run build -w shared
RUN npm run build -w backend
ENV PORT=8080
EXPOSE 8080
CMD ["node", "backend/dist/index.js"]
