FROM python:3.12-slim

# ffmpeg/ffprobe: used by services/video_ingest_service.py and the CMS video-upload
# path in routers/admin_content.py for HLS transcoding + thumbnail extraction.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV PYTHONUNBUFFERED=1
EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
    CMD curl -f http://127.0.0.1:8001/docs || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
