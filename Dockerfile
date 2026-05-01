# Use Node.js 20 Alpine
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production deps
RUN npm install --omit=dev

# Copy app code
COPY . .

# Cloud Run requires this env
ENV PORT=8080

# Expose port
EXPOSE 8080

# Start app
CMD ["node", "src/server.js"]