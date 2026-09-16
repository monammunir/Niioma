# NIIOMA — The New Operating System for Global Business

A high-performance, cinematic horizontal-scroll landing page for **NIIOMA**, inspired by futuristic Apple Keynote mockups.

## Features

- **Multi-Section Horizontal Scroll**: Smooth wheel-driven horizontal scrolling with Apple-style slide snapping, keyboard arrow navigation, and responsive touch gestures.
- **Cinematic Clean Video Backgrounds**: Custom-processed video animations with watermarks removed, black levels calibrated, and seamless radial/elliptical blending:
  - **Slide 1 (Hero)**: Full-bleed cosmic neon arc with 3D perspective typography (`N I I O M A`).
  - **Slide 2 (About)**: 3D Apple Tablet mockup showcasing live global enterprise telemetry.
  - **Slide 3 (Capabilities)**: Holographic 3D Earth core with frosted glass capability cards.
  - **Slide 4 (How It Works)**: Dual-winged ecosystem cards framing a centered, seamlessly merged purple orbital trajectory globe.
  - **Slide 5 (Industries)**: Interactive cross-industry impact matrix covering 8 critical domains.
  - **Slide 6 (Join Us)**: Luminous closing CTA with interactive early access registration modal.
- **Floating Frosted Glass Navbar**: Pinned global navigation with active state tracking.
- **Early Access Modal**: Interactive registration form with real-time feedback.

## Project Structure

```
├── index.html        # Main HTML structure
├── style.css         # Apple-inspired futuristic styles and keyframes
├── script.js         # Horizontal scroll engine, particles, and modal logic
├── assets/           # Processed and optimized MP4 videos and fallback posters
│   ├── niioma-bg.mp4
│   ├── niioma-platform.mp4
│   ├── niioma-globe.mp4
│   ├── niioma-network.mp4
│   ├── hero-poster.jpg
│   ├── poster-platform.jpg
│   ├── poster-globe.jpg
│   └── poster-network.jpg
└── README.md
```

## Getting Started

Simply open `index.html` in any modern web browser, or run a local HTTP server:

```bash
python -m http.server 3000
```
Then navigate to `http://localhost:3000`.
