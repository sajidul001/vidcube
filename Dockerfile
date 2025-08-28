# Build frontend
FROM node:18 AS frontend
WORKDIR /app
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# Build backend (compile TS)
FROM node:18 AS backend
WORKDIR /app
COPY backend ./backend
COPY --from=frontend /app/frontend/dist ./backend/public
WORKDIR /app/backend
RUN npm install
RUN npm run build

# Final runtime image
FROM node:18-slim
WORKDIR /app
# copy compiled backend only
COPY --from=backend /app/backend/dist ./dist
COPY --from=backend /app/backend/public ./public
COPY --from=backend /app/backend/package.json ./package.json
ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/server.js"]
