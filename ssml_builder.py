"""SSML builder for edge-tts with prosody, breaks, and emotions."""
import re

# Emotion detection keywords
EMOTION_KEYWORDS = {
    "cheerful": ["!", "great", "wonderful", "amazing", "excellent", "fantastic", "love"],
    "sad": ["sorry", "afraid", "unfortunately", "sad", "regret"],
    "angry": ["angry", "frustrated", "hate", "terrible", "awful"],
    "friendly": ["?", "please", "thank", "welcome", "hello"],
}

def detect_emotion(sentence: str) -> str:
    """Detect emotion from sentence content and punctuation."""
    sentence_lower = sentence.lower()

    # Punctuation-based detection (highest priority)
    if "!" in sentence:
        return "cheerful"
    if "?" in sentence:
        return "friendly"

    # Keyword-based detection
    for emotion, keywords in EMOTION_KEYWORDS.items():
        if any(kw in sentence_lower for kw in keywords):
            return emotion

    return "general"

def build_ssml(text: str, voice: str, emotion: str = None) -> str:
    """
    Build SSML from plain text with automatic prosody and breaks.

    Args:
        text: Plain text sentence
        voice: Voice name (e.g., "en-US-JennyNeural")
        emotion: Emotion override (auto-detected if None)

    Returns:
        SSML string
    """
    if emotion is None:
        emotion = detect_emotion(text)

    # Escape XML special characters
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

    # Add breaks at punctuation
    # Comma/semicolon: 300ms pause
    text = re.sub(r',\s*', ',<break time="300ms"/> ', text)
    text = re.sub(r';\s*', ';<break time="300ms"/> ', text)

    # Period/exclamation/question: 500ms pause
    text = re.sub(r'\.\s*', '.<break time="500ms"/> ', text)
    text = re.sub(r'!\s*', '!<break time="500ms"/> ', text)
    text = re.sub(r'\?\s*', '?<break time="500ms"/> ', text)

    # Apply emotion-based prosody
    prosody_start = ""
    prosody_end = ""

    if emotion == "cheerful":
        prosody_start = '<prosody pitch="+15%" rate="fast">'
        prosody_end = '</prosody>'
    elif emotion == "sad":
        prosody_start = '<prosody pitch="-10%" rate="slow">'
        prosody_end = '</prosody>'
    elif emotion == "angry":
        prosody_start = '<prosody pitch="-5%" rate="fast" volume="+10%">'
        prosody_end = '</prosody>'
    elif emotion == "friendly":
        # Questions: slight pitch rise
        prosody_start = '<prosody pitch="+5%">'
        prosody_end = '</prosody>'

    # Wrap in SSML structure
    ssml = f'''<speak version="1.0" xmlns:mstts="http://www.w3.org/2001/mstts">
  <voice name="{voice}">
    {prosody_start}{text}{prosody_end}
  </voice>
</speak>'''

    return ssml
