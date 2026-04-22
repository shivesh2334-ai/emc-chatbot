# emc-chatbot

Bilingual (Hindi + English) web chatbot for **Easy My Care Clinic**.

## Features

- Static web chat UI (offline/default mode, no LLM required)
- Local structured clinic knowledge base: `data/clinic_knowledge.json`
- Hindi/English behavior:
  - Auto-detects language from user message (or use language selector)
  - Responds in the same selected/detected language
- Voice input via browser Speech Recognition API (with typed-input fallback)
- Voice output via browser Speech Synthesis API
- Accessible controls:
  - Mic listening status indicator
  - Stop speech button

## Clinic knowledge source

Knowledge is seeded from service information listed on:
- https://easymycareclinic.com/

## Run locally

From repository root:

```bash
python3 -m http.server 8000
```

Then open:
- http://localhost:8000/

## Refresh/update clinic content

A helper script is provided:

```bash
python3 /home/runner/work/emc-chatbot/emc-chatbot/scripts/refresh_kb.py
```

What it does:
- Fetches the clinic website homepage
- Updates knowledge metadata (`source.updated_at` and notes)
- Keeps the structured bilingual service entries in `data/clinic_knowledge.json`

After running it, manually review and adjust `data/clinic_knowledge.json` if the website content changed significantly.

## Browser notes

- Voice input requires a browser that supports `SpeechRecognition` / `webkitSpeechRecognition`.
- If unavailable, the app automatically falls back to typed chat.
- Voice output requires `speechSynthesis` support.
