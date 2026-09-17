# video-factory

Monorepo scaffold for the video-explainer factory.

## Quickstart (silent preview mode — no TTS needed)
npm install
npm run sb:hcf        # generates storyboards/hcf-60-84-108.json
npm run dev:renderer  # Remotion Studio at http://localhost:3000
npm test              # golden math tests

## Later
docker compose up -d  # redis + postgres + minio (for the pipeline worker)
