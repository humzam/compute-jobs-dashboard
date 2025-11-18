FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci --only=production=false
COPY . .

EXPOSE 5173

CMD ["node", "--experimental-modules", "--es-module-specifier-resolution=node", "./node_modules/vite/bin/vite.js", "--host", "0.0.0.0"]