FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install server dependencies
RUN npm install

# Copy source code
COPY . .

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