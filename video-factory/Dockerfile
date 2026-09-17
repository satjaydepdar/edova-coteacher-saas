# Video generation engine (Remotion render + Amazon Polly TTS + S3 upload).
# Runs the same server.ts on Linux here as in local Windows dev -- the previous
# cmd.exe/PowerShell-SAPI dependencies were removed specifically so this works.
FROM node:20-bookworm-slim

# Chromium headless-render deps (Remotion) + ffmpeg (video encode/mux) + curl (healthcheck).
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg curl \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
    libpango-1.0-0 libpangocairo-1.0-0 libcairo2 fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/pipeline/package.json apps/pipeline/package.json
COPY apps/renderer/package.json apps/renderer/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/math/package.json packages/math/package.json
COPY packages/storyboard/package.json packages/storyboard/package.json
RUN npm ci

COPY . .

# Downloads Remotion's headless Chrome build ahead of time (avoids a slow first render).
RUN npx --workspace=@vf/renderer remotion browser ensure || true

ENV NODE_ENV=production
EXPOSE 5050
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
    CMD curl -f http://127.0.0.1:5050/health || exit 1

CMD ["npx", "tsx", "apps/pipeline/src/server.ts"]
