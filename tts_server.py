"""Edge-TTS microservice — generates MP3 from text with disk cache."""
import hashlib
import os
import subprocess
import tempfile
import sys
from flask import Flask, request, send_file

app = Flask(__name__)
CACHE_DIR = "/var/cache/tts"
os.makedirs(CACHE_DIR, exist_ok=True)


@app.route("/")
def health():
    return "tts ok"


VOICES = {
    "male": "en-US-GuyNeural",
    "female": "en-US-JennyNeural",
}


@app.route("/api/tts")
def tts():
    text = request.args.get("text", "").strip()
    if not text:
        return "missing text", 400

    voice_key = request.args.get("voice", "female")
    voice = VOICES.get(voice_key, VOICES["female"])

    # Include voice in cache key so different voices get different files
    key = f"{voice}:{text.strip().lower()}"
    file_id = hashlib.sha256(key.encode()).hexdigest()[:16]
    cache_path = os.path.join(CACHE_DIR, f"{file_id}.mp3")

    if os.path.exists(cache_path):
        return send_file(cache_path, mimetype="audio/mpeg")

    result = subprocess.run(
        [
            sys.executable, "-m", "edge_tts",
            "--voice", voice,
            "--text", text,
            "--write-media", cache_path,
        ],
        capture_output=True, text=True, timeout=30,
    )

    if result.returncode != 0:
        return f"tts failed: {result.stderr}", 500

    return send_file(cache_path, mimetype="audio/mpeg")


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000)
