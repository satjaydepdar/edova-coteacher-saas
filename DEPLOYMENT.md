# Deploying to AWS

## What was fixed to make this deployable at all

The on-demand video generation flow (`backend/routers/video_engine.py` calling out to
`video-factory`'s render service) previously only worked when both apps ran on the same
Windows machine:

1. **TTS was Windows-only.** `video-factory/apps/pipeline/src/tts.ts` shelled out to
   PowerShell's `System.Speech.Synthesizer` -- doesn't exist on Linux. Replaced with
   **Amazon Polly** (`@aws-sdk/client-polly`), which also happens to be the natural
   choice once you're already targeting AWS.
2. **The render invocation was Windows-only.** `server.ts` spawned `cmd.exe /c "npx
   remotion render ..."` as a shell string. Replaced with a direct, portable `spawn`
   call that runs identically on Linux and Windows.
3. **Finished videos never left the render container's local disk.** The SaaS backend
   read the rendered `.mp4` via a local filesystem path shared with video-factory --
   only possible when they're literally the same machine. Now `server.ts` uploads the
   finished render straight to S3 itself (`apps/pipeline/src/s3.ts`, same bucket/prefix
   convention as `backend/services/s3_client.py`) and hands back an `s3Key`. The SaaS
   backend just records that key -- no bytes ever pass through it.
4. **The "engine offline" fallback masked real outages.** It used to silently serve a
   canned local video whenever the HTTP call failed, including in production. Now that
   fallback only triggers when `VIDEO_ENGINE_URL` is pointed at localhost (a dev
   signal); otherwise an unreachable engine correctly returns `503`.

Verify locally that the two services are genuinely decoupled (not just "happens to work
because they're on one machine") before deploying:

```bash
cp .env.production.example .env.production   # fill in a real EDOVA_DB_DSN + EDOVA_JWT_SECRET
docker compose -f docker-compose.prod.yml --env-file .env.production up --build
curl -X POST http://localhost:8001/api/video/generate -H 'Content-Type: application/json' \
  -d '{"problemType":"trig-depression"}'
```

## What still needs to be provisioned in AWS (not done by this change)

This repo change makes the code deployable; it doesn't provision infrastructure. You
still need, with real AWS credentials:

1. **RDS Postgres** -- create the `edtech_platform` database, run the migration
   scripts in `backend/scripts/`, put the connection string in `EDOVA_DB_DSN`.
2. **Two ECR repositories** -- one for `backend/Dockerfile`, one for
   `video-factory/Dockerfile`. Build and push both images.
3. **Two ECS Fargate services in the same VPC**:
   - `backend` -- public-facing (behind an ALB), needs the env vars in
     `.env.production.example`.
   - `video-engine` -- internal only, not exposed to the internet. Give it a
     resolvable internal address (AWS Cloud Map service discovery, or a private/internal
     ALB) and set the `backend` service's `VIDEO_ENGINE_URL` to that address.
   - Security group: only allow the `backend` service to reach `video-engine` on
     port 5050.
4. **IAM task role** (attached to both services, no hardcoded keys anywhere):
   - `s3:PutObject` / `s3:GetObject` on the `EDOVA_S3_BUCKET` bucket
   - `polly:SynthesizeSpeech` (video-engine only)
5. **S3 bucket** -- `innuxai-edova-coteacher` (or your own), same bucket both
   services point at.
6. **Frontend** -- build (`npm run build` in `frontend/`) and host the static output
   on S3 + CloudFront, or Amplify; point it at the backend ALB's URL.

## Known remaining limitation

`video-engine`'s job state (`JOBS` Map in `server.ts`) is in-memory, so it only
supports a single running instance -- if you need to scale it beyond one task,
job status won't be visible from a different instance than the one that started
the job. Not fixed here; flagging it so it isn't a surprise later.
