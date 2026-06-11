"""Edge-TTS microservice — generates MP3 from text with disk cache + SSML support."""
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
    # Legacy keys (backward compat)
    "male": "en-US-GuyNeural",
    "female": "en-US-JennyNeural",

    # New voice pool (multi-speaker)
    "female_young": "en-US-JennyNeural",
    "female_mature": "en-US-AriaNeural",
    "male_young": "en-US-GuyNeural",
    "male_mature": "en-US-DavisNeural",
    "female_child": "en-US-AnaNeural",
    "male_child": "en-US-AnthonyNeural",
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


@app.route("/api/tts-voice")
def tts_voice():
    """Generate TTS with specific voice (supports extended voice pool)."""
    text = request.args.get("text", "").strip()
    if not text:
        return "missing text", 400

    voice_key = request.args.get("voice", "female_young")
    voice = VOICES.get(voice_key)
    if not voice:
        return f"unknown voice: {voice_key}", 400

    # Cache key includes voice
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


@app.route("/api/tts-ssml", methods=["POST"])
def tts_ssml():
    """Generate TTS from SSML text (supports prosody, breaks, emotions)."""
    data = request.get_json()
    if not data or "ssml" not in data:
        return "missing ssml field", 400

    ssml = data["ssml"].strip()
    if not ssml:
        return "empty ssml", 400

    # Cache key based on SSML content
    key = f"ssml:{ssml}"
    file_id = hashlib.sha256(key.encode()).hexdigest()[:16]
    cache_path = os.path.join(CACHE_DIR, f"{file_id}.mp3")

    if os.path.exists(cache_path):
        return send_file(cache_path, mimetype="audio/mpeg")

    # Write SSML to temp file (edge-tts doesn't accept stdin)
    with tempfile.NamedTemporaryFile(mode='w', suffix='.ssml', delete=False) as f:
        f.write(ssml)
        ssml_file = f.name

    try:
        result = subprocess.run(
            [
                sys.executable, "-m", "edge_tts",
                "--file", ssml_file,
                "--write-media", cache_path,
            ],
            capture_output=True, text=True, timeout=30,
        )

        if result.returncode != 0:
            return f"tts failed: {result.stderr}", 500

        return send_file(cache_path, mimetype="audio/mpeg")
    finally:
        os.unlink(ssml_file)


if __name__ == "__main__":
    # Use port 5001 to avoid conflict with macOS ControlCenter on 5000
    app.run(host="127.0.0.1", port=5001)
