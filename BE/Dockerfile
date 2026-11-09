FROM node:24-alpine
WORKDIR /app
COPY BE/package*.json ./BE/
RUN npm ci --omit=dev --prefix BE
COPY BE/ ./BE/
COPY FE/ ./FE/
EXPOSE 8080
CMD ["node", "BE/server.js"]
