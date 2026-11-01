# Chromesthesia Visualizer

A web app for recording the colors I perceive in music (chromesthesia) and analyzing how they relate to the songs. 

![Demo]()

## Why I built this

[Chromesthesia](https://en.wikipedia.org/wiki/Chromesthesia) is a type of synesthesia where sound involuntarily triggers the sensation of seeing color. When I listen to music, I see colors tied to specific songs and moments within them. I am building this tool to record these associations as they happen and to find patterns in them. I want to gather data so I can understand what makes songs have their color. I also want to be able to generate playlists based on the hue, brightness, etc. 

## Features

- **Built:** 
    - Basic web app
    - Spotify now playing integration
    - Saving to MongoDB
- **Planned:**
    - Color tied to specific timestamps in a song
    - Two way searching / filtering
        - Search a color, brightness, range of hues, etc and get all songs that match
        - Search a song, band, genre, decade, etc and get the colors associated with those songs

## Getting started

## How it works



### Key design decisions:
- **ChessGame has no hardware code**, so the whole engine is unit-tested on a laptop with `pio test -e test`.
- **Attacks use raycasting, not move generation**, because legal-move generation needs attack checks and the reverse would recurse forever.
- **Game status is updated explicitly, not in `applyMove`**, because legality filtering calls apply and undo for every candidate move, and computing status each time is too slow on an ESP32.
- **One owner of `FastLED.show()`**, so animations can't write to the strips at the same time.

## Status

Work in progress. Started in 2025. Going to revisit. The basic flow works, I'm deciding whether to rework parts of the original codebase before continuing to build features. 

## License



## Contact
