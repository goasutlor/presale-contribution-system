FROM node:18-alpine

WORKDIR /app

# Copy server package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy server source files explicitly
COPY tsconfig.server.json ./
COPY src/ ./src/
COPY server.js ./

# Prepare and install client dependencies
COPY client/package.json client/package-lock.json ./client/
WORKDIR /app/client
RUN npm install

# Copy client source and public explicitly
COPY client/public ./public
COPY client/src ./src
COPY client/tailwind.config.js ./tailwind.config.js
COPY client/postcss.config.js ./postcss.config.js
COPY client/tsconfig.json ./tsconfig.json

# Build full app (server build + CRA build)
WORKDIR /app
RUN npm run build

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "server.js"]