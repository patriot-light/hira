# Design Guidelines

This file summarizes the visual and interaction guidelines. The canonical JSON is available at the repository root: `design_guidelines.json`.

Identity & Tone

- Name: Hira Institute
- Mission: Modernizing Quranic education with a blend of spiritual tradition and Swiss-style precision.
- Tone: Serene, Professional, Structured, Uplifting

Typography

- Primary: Manrope (English)
- Secondary: IBM Plex Sans Arabic (Arabic)

Colors & Tokens

- Primary: `#12a89d` (brand teal)
- Secondary: `#2ab572`
- Neutrals and accents are defined in `design_guidelines.json`.

Layout & Components

- Use the Bento grid system and generous spacing.
- Buttons are rounded (pill-shaped) with subtle transform animations.

Accessibility

- Maintain contrast ratio >= 4.5:1 for text.
- RTL support is required; use logical CSS properties and test UI in dir='rtl'.

Assets

- Example textures and patterns are referenced in the JSON.

Developer notes

- Add `data-testid` attributes to interactive elements.
- Avoid placeholder lorem ipsum text for copy.
