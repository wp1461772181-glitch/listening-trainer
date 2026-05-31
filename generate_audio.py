import asyncio
import edge_tts
import os

AUDIO_DIR = os.path.join(os.path.dirname(__file__), "public", "audio")

VOICE = "en-US-AriaNeural"

lessons = [
    # Daily Life - slower, clearer
    ("daily-01", "I would like a medium latte with oat milk and a blueberry muffin, please.", "-20%"),
    ("daily-02", "Excuse me, could you tell me how to get to the nearest train station from here?", "-20%"),
    ("daily-03", "Hi, I would like to book a table for three people at seven o'clock this evening.", "-20%"),
    ("daily-04", "The weather has been absolutely gorgeous lately, has not it? Perfect for a weekend hike.", "-20%"),
    ("daily-05", "I have had a sore throat and a runny nose for about three days now. Do you have anything that could help?", "-20%"),
    # Campus Life - medium speed
    ("campus-01", "I was wondering if the library has any study rooms available for booking this Friday afternoon.", "-5%"),
    ("campus-02", "I am thinking of dropping this tutorial and switching to the Wednesday morning session instead.", "-5%"),
    ("campus-03", "The counselling service offers free appointments for all enrolled students throughout the semester.", "-5%"),
    ("campus-04", "We need to finalise the presentation slides by Thursday, otherwise we will not have time to rehearse.", "-5%"),
    ("campus-05", "If you would like to discuss your essay feedback, my office hours are Tuesdays from two to four.", "-5%"),
    # Academic Lectures - natural speed
    ("academic-01", "The mitochondria, often described as the powerhouse of the cell, are responsible for producing adenosine triphosphate through oxidative phosphorylation.", "+0%"),
    ("academic-02", "When the price of a good increases, the quantity demanded typically decreases, assuming all other factors remain constant.", "+0%"),
    ("academic-03", "The Industrial Revolution fundamentally transformed agricultural societies into industrialised urban centres throughout the nineteenth century.", "+0%"),
    ("academic-04", "Working memory allows us to temporarily hold and manipulate information, which is crucial for reasoning and decision-making processes.", "+0%"),
    ("academic-05", "Rising global temperatures have led to significant changes in precipitation patterns, affecting agricultural productivity across many regions.", "+0%"),
]


async def generate(lesson_id, text, rate):
    path = os.path.join(AUDIO_DIR, f"{lesson_id}.mp3")
    tts = edge_tts.Communicate(text, VOICE, rate=rate)
    await tts.save(path)
    print(f"  OK  {lesson_id}.mp3")


async def main():
    os.makedirs(AUDIO_DIR, exist_ok=True)
    for lid, text, rate in lessons:
        await generate(lid, text, rate)


if __name__ == "__main__":
    asyncio.run(main())
