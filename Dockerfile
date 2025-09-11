FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install server dependencies
RUN npm install

# Copy source code (excluding client for now)
COPY . .

# Copy client directory separately
COPY client/ ./client/

# Verify client files exist
RUN ls -la client/
RUN ls -la client/public/

# Install client dependencies
WORKDIR /app/client
RUN npm install

# Go back to root directory
WORKDIR /app

# Build React app
RUN npm run build

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "server.js"]