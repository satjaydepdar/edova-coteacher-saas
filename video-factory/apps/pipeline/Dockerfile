FROM node:20-bookworm-slim

# Install Chromium dependencies for Remotion rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy root workspace and package files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install dependencies and build
RUN npm install
RUN npm run build --if-present

WORKDIR /app/apps/pipeline

CMD ["npm", "run", "worker"]
