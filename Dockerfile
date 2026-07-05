FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    chromium \
    ffmpeg \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./
RUN npm install --production

COPY client/package*.json client/
RUN cd client && npm install && cd ..

COPY . .

RUN cd client && npm run build && cd ..

EXPOSE 3000

CMD ["node", "server/app.js"]
