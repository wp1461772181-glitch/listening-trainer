#!/usr/bin/env python3
"""A/B test: old TTS (plain text) vs new TTS (SSML with prosody/breaks/emotions)."""

import requests
import os
import sys

TTS_SERVER = "http://localhost:5001"
OUTPUT_DIR = "ab_test_tts_output"

TEST_SENTENCES = [
    "Hello, how are you today?",
    "That's amazing! I'm so happy for you!",
    "I'm sorry, but unfortunately we can't help you right now.",
    "The meeting is at 3 PM, don't be late!",
    "Could you please send me the report by Friday?",
]

def generate_old_tts(text, index):
    """Old TTS: plain text, no SSML."""
    resp = requests.get(f"{TTS_SERVER}/api/tts", params={"text": text, "voice": "female"})
    if resp.status_code != 200:
        print(f"✗ Old TTS failed for sentence {index}: {resp.status_code}")
        return None

    output_path = os.path.join(OUTPUT_DIR, f"old_{index}.mp3")
    with open(output_path, "wb") as f:
        f.write(resp.content)
    return output_path

def generate_new_tts(text, index):
    """New TTS: SSML with prosody/breaks/emotions."""
    # Import SSML builder
    sys.path.insert(0, os.path.dirname(__file__))
    from ssml_builder import build_ssml

    ssml = build_ssml(text, "en-US-JennyNeural")

    resp = requests.post(f"{TTS_SERVER}/api/tts-ssml", json={"ssml": ssml})
    if resp.status_code != 200:
        print(f"✗ New TTS failed for sentence {index}: {resp.status_code}")
        return None

    output_path = os.path.join(OUTPUT_DIR, f"new_{index}.mp3")
    with open(output_path, "wb") as f:
        f.write(resp.content)
    return output_path

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=== A/B Test: TTS Quality (Old vs New) ===\n")
    print(f"Generating {len(TEST_SENTENCES)} sentences with both methods...\n")

    for i, text in enumerate(TEST_SENTENCES):
        print(f"Sentence {i+1}: {text[:50]}...")

        old_path = generate_old_tts(text, i)
        new_path = generate_new_tts(text, i)

        if old_path and new_path:
            old_size = os.path.getsize(old_path)
            new_size = os.path.getsize(new_path)
            print(f"  ✓ Old: {old_path} ({old_size} bytes)")
            print(f"  ✓ New: {new_path} ({new_size} bytes)")
        else:
            print(f"  ✗ Failed")

        print()

    print("=== Test Complete ===")
    print(f"Output directory: {OUTPUT_DIR}/")
    print("\nListen and compare:")
    for i in range(len(TEST_SENTENCES)):
        print(f"  Sentence {i+1}:")
        print(f"    Old: ab_test_tts_output/old_{i}.mp3")
        print(f"    New: ab_test_tts_output/new_{i}.mp3")

    print("\nPlay commands (macOS):")
    for i in range(len(TEST_SENTENCES)):
        print(f"  # Sentence {i+1}")
        print(f"  afplay ab_test_tts_output/old_{i}.mp3")
        print(f"  afplay ab_test_tts_output/new_{i}.mp3")

if __name__ == "__main__":
    main()
