# Deutsch üben

A small website for practising German noun genders: pick **der**, **die** or
**das** for nouns shown in random order. The interface is in German, the
translations under each noun are in Polish or English (British).

## Features

- Quizzes split into rounds, plus an "Alle Wörter" option with every noun.
- Nouns appear in random order; a missed noun comes back twice later in the
  same round.
- A picture (emoji) and a Polish or English translation for each noun
  (Polish browsers start with Polish, all others with English; `#pl` or
  `#en` in the address selects it directly), with a switch
  to hide them until the answer is given.
- Score, streak and a summary listing the nouns to review.
- Plain HTML, CSS and JavaScript: no build step, no server, no tracking.

## Running it

Open `index.html` in a browser. Everything, fonts included, is served from
the project folder, so it works offline and contacts no third-party servers.

## Project structure

```
index.html               start page with the list of exercises
orte-der-die-das.html    quiz "Orte" (places in town and at home)
css/                     shared colours, fonts and layout
fonts/                   Barlow web fonts and their licence (OFL.txt)
js/orte.js               nouns for the "Orte" quiz
```
## Adding words

Add a line to the right round in the word file, e.g. `js/orte.js`

## Credits

- Pictures: emoji from the visitor's own system font, so they look slightly
  different on each device.
- Fonts: [Barlow](https://github.com/jpt/barlow) and Barlow Semi Condensed
  by The Barlow Project Authors, SIL Open Font License 1.1, included in
  `fonts/` with the licence text in `fonts/OFL.txt`.
- The nouns are basic A1 vocabulary; selection, rounds and translations are
  the author's own. This project is not affiliated with any textbook
  publisher.

## License

[MIT](LICENSE) © 2026 Radosław Martyniszyn
