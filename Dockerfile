FROM node:18-alpine

WORKDIR /app

# Cache-busting arg to force Railway to rebuild layers when changed
ARG APP_BUILD_ID
ENV APP_BUILD_ID=${APP_BUILD_ID}

# Track build-id to ensure rebuilds when changed
COPY build-id.txt ./build-id.txt

# Force rebuild by changing timestamp
RUN echo "Build started at: $(date)" > /tmp/build-start.txt

# Copy server package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy server source files explicitly
COPY tsconfig.server.json ./
COPY src/ ./src/
COPY server.js ./

# Copy entire client directory (excluding build/node_modules via .dockerignore)
COPY client/ ./client/

# Prepare and install client dependencies
WORKDIR /app/client
RUN npm install

# Sanity check to ensure CRA public exists
RUN test -f /app/client/public/index.html

# Debug: Force rebuild with timestamp
RUN echo "Build timestamp: $(date)" > /tmp/build-info.txt

# Build full app (server build + CRA build)
WORKDIR /app
RUN npm run build

# Force client rebuild to ensure latest changes
WORKDIR /app/client
RUN rm -rf build
RUN rm -rf node_modules/.cache
RUN rm -rf node_modules
RUN npm install
RUN npm run build
RUN echo "Client build completed at: $(date)" > build/build-info.txt
RUN ls -la build/

# Expose port
EXPOSE 8080

# Start server (full API server)
CMD ["npm", "run", "dev:server"]