# TalkTown 🏙️

A free app for practising spoken **English, Spanish and French**. You walk around an illustrated city and have real conversations out loud with the people in each place, from ordering coffee to a job interview.

## Features

- **3 languages.** English, Spanish and French, each with all 9 places, native speech recognition and voices, and an English translation on every line. Progress is tracked separately per language.
- **Illustrated characters and places.** Every character is drawn in SVG: they blink, lip-sync while talking, and react when you get it right or need another try. Each place has its own illustrated scene.
- **9 places, 3 levels.** Café, market, taxi, restaurant, hotel, clinic, airport, job interview and a rooftop party. Each is a branching conversation, and new places unlock as you earn XP.
- **Talk out loud.** Speech recognition hears your reply and the character answers with their own voice. You can type instead at any time.
- **Say it your way.** Replies are matched by meaning (keywords), so you don't have to repeat a script word for word. Saying something in your own words earns bonus XP.
- **Pronunciation feedback.** A % match score that shows which words were missed.
- **Hints.** Ideas start blurred, so you try first. Every hint can be played aloud and saved.
- **Phrasebook and drill.** Save useful phrases and practise them in quick speaking rounds.
- **Motivation.** XP, levels, coins, a daily streak, a daily goal, stars per place, badges and confetti.
- **Installable and works offline (PWA).** No account and no ads. Progress is stored on the device.

## Run it

It is plain HTML, CSS and JS, with no build step.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

For voice input, use Chrome, Edge or Safari. The microphone needs `https://` or `localhost`.

## Deploy for free

Push to GitHub, then turn on **Settings → Pages → Deploy from branch**. Netlify and Vercel also work: drop the folder in. On a phone, open the site and choose **Add to Home Screen** to install it like an app.

## Add a new place

Add an entry to `js/scenes.js` (the comment at the top explains the format), then add its translations to `js/lang/es.js` and `js/lang/fr.js`, its character look to `js/characters.js` and its backdrop to `js/art.js`.

## Add a language

Copy `js/lang/es.js`, translate it, and register it in `LANGS` and `PACKS` in `js/content.js`.
