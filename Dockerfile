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

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh
RUN echo 'echo "🚀 Starting Presale Contribution System..."' >> /app/start.sh
RUN echo 'echo "🔍 Environment: $NODE_ENV"' >> /app/start.sh
RUN echo 'echo "🔍 Railway Environment: $RAILWAY_ENVIRONMENT"' >> /app/start.sh
RUN echo 'echo "🔍 Database URL: ${DATABASE_URL:+Set}"' >> /app/start.sh
RUN echo 'export NODE_ENV=${NODE_ENV:-production}' >> /app/start.sh
RUN echo 'if [ "$DATABASE_URL" ]; then' >> /app/start.sh
RUN echo '  echo "🐘 Using PostgreSQL database"' >> /app/start.sh
RUN echo '  echo "🔄 Testing PostgreSQL connection..."' >> /app/start.sh
RUN echo '  node test-postgres-connection.js' >> /app/start.sh
RUN echo '  if [ $? -ne 0 ]; then' >> /app/start.sh
RUN echo '    echo "❌ PostgreSQL connection test failed"' >> /app/start.sh
RUN echo '    exit 1' >> /app/start.sh
RUN echo '  fi' >> /app/start.sh
RUN echo '  echo "🔄 Running database migration..."' >> /app/start.sh
RUN echo '  node scripts/migrate-to-postgres.js' >> /app/start.sh
RUN echo '  if [ $? -ne 0 ]; then' >> /app/start.sh
RUN echo '    echo "❌ Database migration failed"' >> /app/start.sh
RUN echo '    exit 1' >> /app/start.sh
RUN echo '  fi' >> /app/start.sh
RUN echo 'else' >> /app/start.sh
RUN echo '  echo "❌ DATABASE_URL not found - PostgreSQL required for Railway deployment"' >> /app/start.sh
RUN echo '  echo "Please ensure PostgreSQL service is connected to your Railway project"' >> /app/start.sh
RUN echo '  exit 1' >> /app/start.sh
RUN echo 'fi' >> /app/start.sh
RUN echo 'echo "✅ Starting server..."' >> /app/start.sh
RUN echo 'npm start' >> /app/start.sh
RUN chmod +x /app/start.sh

# Start the application
CMD ["/app/start.sh"]