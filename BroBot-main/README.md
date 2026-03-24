# BroBot

A virtual assistant that gives intentionally wrong answers while calling you "bro" way too much. Uses a face as an animated talking avatar.

Built for the **Stupid Hackathon at Western University** 🎓

## What is this?

It's an AI assistant that:
- Gives confidently wrong answers to everything
- Calls you "bro" constantly (there's a counter for it)
- Uses video clips of your face as a talking avatar
- Speaks responses out loud with text-to-speech
- Shows different emotions based on how annoyed it is

Think of it as if ChatGPT went to the gym, got really into protein shakes, and stopped caring about being helpful.

## Demo

Ask it anything and watch it give you terrible advice with way too much confidence.

## Tech Stack

- OpenAI GPT-4o for generating unhelpful responses
- ElevenLabs for text-to-speech
- Vanilla JS (no frameworks, we're keeping it simple)

## Setup

### You'll need:
- Node.js
- [OpenAI API key](https://platform.openai.com/api-keys)
- [ElevenLabs API key + Voice ID](https://elevenlabs.io/)

### Quick start:

```bash
npm install
```

Copy `config.js.example` to `config.js` and add your API keys:

```javascript
const CONFIG = {
    OPENAI_API_KEY: 'your-key-here',
    ELEVENLABS_API_KEY: 'your-key-here',
    ELEVENLABS_VOICE_ID: 'your-voice-id-here',
    // ...
};
```

Run it:

```bash
npm start
```

Opens at `http://localhost:8080`

### Avatar Videos

You need to record yourself and put the clips in a `videos/` folder:

| File | What it does |
|------|--------------|
| `Blinking.mov` | Idle state (loops) |
| `Talking.mov` | Plays while speaking |
| `ShakeHead.mov` | When it's annoyed |
| `EyeBrowRaise.mov` | When confused |
| `Smile.mov` | Rare moments of smugness |
| `Disturbed.mov` | When you ask something weird |

See [VIDEO_SETUP.md](VIDEO_SETUP.md) for recording specs.

## Files

```
├── index.html       # Main page
├── styles.css       # Styling
├── config.js        # API keys (don't commit this!)
├── api-services.js  # OpenAI + ElevenLabs calls
├── app.js           # Main logic
├── videos/          # Your avatar clips
└── package.json
```

## Customize

**Change the personality:** Edit `SYSTEM_PROMPT` in `config.js`

**Add more emotions:** Drop a new video in `videos/`, then add it to the `emotionMap` in `app.js`

## License

MIT

---

*Because sometimes the best use of AI is to make something completely useless.*
