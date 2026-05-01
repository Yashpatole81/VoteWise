# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Set to production
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# Expose port 8080 (Cloud Run expected port)
EXPOSE 8080

# Start the application
CMD ["node", "src/server.js"]
