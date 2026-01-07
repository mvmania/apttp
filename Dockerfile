# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Setup the backend
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install

COPY server/ ./server/
COPY --from=frontend-builder /app/dist ./dist

# Install tsx to run the TypeScript server directly without a separate build step
RUN npm install -g tsx

EXPOSE 10000
CMD ["tsx", "server/index.ts"]
