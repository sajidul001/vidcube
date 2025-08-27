# Build frontend
FROM node:18 AS frontend
WORKDIR /app
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# Build backend
FROM node:18 AS backend
WORKDIR /app
COPY backend ./backend
COPY --from=frontend /app/frontend/dist ./backend/public
WORKDIR /app/backend
RUN npm install

# Final
FROM node:18-slim
WORKDIR /app
COPY --from=backend /app/backend ./
ENV NODE_ENV=production
CMD ["npm", "start"]
