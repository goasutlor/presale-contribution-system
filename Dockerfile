# Working Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy everything first
COPY . .

# Create public directory and files
RUN mkdir -p client/public
RUN echo '<!DOCTYPE html><html><head><title>Presale Contribution</title></head><body><div id="root"></div></body></html>' > client/public/index.html
RUN echo '{"short_name":"Presale Contribution","name":"Presale Contribution Management System"}' > client/public/manifest.json
RUN echo 'favicon' > client/public/favicon.ico

# Install dependencies
RUN npm ci --legacy-peer-deps
RUN cd client && npm ci --legacy-peer-deps

# Create data directory for database
RUN mkdir -p /app/data

# Build the application
RUN npm run build

# Expose port
EXPOSE 5001

# Start the application directly
CMD ["npm", "start"]