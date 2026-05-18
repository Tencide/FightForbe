# API lives in backend/ — used when Fly deploys from the repo root (GitHub integration).
FROM node:20-alpine

RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY backend/ .

EXPOSE 5000

CMD ["node", "server.js"]
