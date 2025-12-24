# Quantum Nexus - News Scraper Prototype

A modern, frontend-only news dashboard for the Quantum Computing industry.

## Features
- **Real-time News**: Fetches latest updates from IonQ, Rigetti, D-Wave, Quantinuum, and PsiQuantum.
- **Hybrid Scraper**: Uses direct HTML parsing for some sites and RSS feeds for others to ensure data reliability.
- **Zero Backend**: Runs entirely in the browser using public APIs (`allorigins.win`, `rss2json`).
- **Modern Tech**: Built with React (via ESM), generic CSS variables, and Glassmorphism design. No build step required.

## How to Run

Since this project uses modern ES Modules, it requires a local web server to run (browsers block `file://` imports for security).

1. Open your terminal in this directory.
2. Run the built-in Python server:
   ```bash
   python3 -m http.server 8000
   ```
3. Open your browser and navigate to:
   [http://localhost:8000](http://localhost:8000)

## Architecture
- `index.html`: Entry point.
- `app.js`: Contains the React logic and Scraper implementations.
- `style.css`: Custom CSS design system.
