# Railway-optimized Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --legacy-peer-deps
RUN cd client && npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Ensure public directory and required files exist
RUN mkdir -p client/public
RUN echo '<!DOCTYPE html><html><head><title>Presale Contribution</title></head><body><div id="root"></div></body></html>' > client/public/index.html
RUN echo '{"short_name":"Presale Contribution","name":"Presale Contribution Management System","icons":[{"src":"favicon.ico","sizes":"64x64 32x32 24x24 16x16","type":"image/x-icon"}],"start_url":".","display":"standalone","theme_color":"#0ea5e9","background_color":"#ffffff"}' > client/public/manifest.json
RUN echo 'favicon placeholder' > client/public/favicon.ico

# Build the application
RUN npm run build

# Expose port
EXPOSE 5001

# Start the application
CMD ["npm", "start"]