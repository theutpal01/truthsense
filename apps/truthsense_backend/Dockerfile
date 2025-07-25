# Use slim base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install native dependencies needed for building
RUN apk add --no-cache \
	python3 \
	make \
	g++ \
	sqlite

# Copy package files separately for better caching
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev && npm cache clean --force

# Copy source code
COPY . .

# Create media directories with proper permissions
RUN mkdir -p media/audio media/temp media/processed && \
	chown -R node:node media

# Use non-root user
USER node

# Set default port
EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
	CMD wget --no-verbose --tries=1 --spider http://localhost:8002/health || exit 1

# Start the app
CMD ["npm", "start"]
