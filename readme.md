
# Scattegories Rehashed
Based on [Swellgarfo's work](https://swellgarfo.com/scattergories/).

A fork of the original scattegories website, designed by children, for children (Made Child-Friendly).
Meant to be displayed and run by a teacher for the whole class, with pen and paper, like the original.

THEME
---
It does include a minor reskin to make it look visually separate from the original.

ADDITIONAL FEATURES
---
- Time is now easier to edit, since it uses minutes and seconds instead of only seconds.
  - It also shows milliseconds when you're running out of time.
- You can reroll the letter on its own.
  - You can also click the letter and type to set it manually.
- Letters don't repeat until half the pool has been played, so hard letters are never forced.
- Pick a topic (School, Science, Leisure, Games, Media, Food, Nature, Everyday, Describe It, Places, People, Words, Holidays, or All) next to the Categories heading. It can be changed before a round starts.
- A Fullscreen button for projecting to the class.
- "Times up!" appears in an on-screen window instead of a browser alert.
- Works offline once it has been opened once (and can be installed from the browser menu).
- Animations are skipped if your device is set to reduce motion.
- The screen stays awake while the page is open.
- Your time, category count and topic are remembered between visits.

REMOVED FROM THE ORIGINAL
---
- Editing, saving and sharing custom category lists (and the online service behind it).

CODE
---
No build step. Everything is plain files:

- `index.html` - the page and its template
- `dist/app.js` - all of the game logic
- `dist/categories.js` - the categories and topics (edit this to change them; the file explains the format)
- `dist/style.css` - styles
- `dist/vendor/` - Vue 2.7.9 and anime.js 2.2.0
- `sw.js` and `manifest.webmanifest` - offline support. If you add, remove or rename a file, update the list in `sw.js` and bump its version.

 Thats about it!
 My name is Logan, and this is **Scattegories Rehashed**.
 See you next [Indeterminate Period Of Time] later, when I make my next project.
