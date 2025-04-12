FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy client and server package files
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Copy all source files
COPY . .

# Install dependencies and build
RUN npm run install-all
RUN npm run build

EXPOSE 5000

# Start the server
CMD ["npm", "start"]
