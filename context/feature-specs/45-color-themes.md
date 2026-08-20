# Feature 45: Custom Color Theme & Light/Dark/OLED Mode Switcher

Support multiple canvas aesthetic themes including export-friendly Light Mode (for PDF/documentation), Obsidian Dark Mode (default neon cyberpunk), and Midnight OLED Mode (high-contrast black).

### Implementation

1. **CSS Variables & Tokens**
   - In `app/globals.css`:
     - Define `[data-theme="light"]`: Light gray background (`#f4f5f8`), white surfaces (`#ffffff`), dark charcoal text (`#111827`), crisp borders (`#e2e8f0`).
     - Define `[data-theme="oled"]`: Pitch black (`#000000`), deep surface (`#0a0a0c`), high-contrast borders (`#27272a`).
     - Define `[data-theme="dark"]` (default Obsidian): `#080809` background with neon cyan/violet accents.

2. **Navbar & Canvas Controls Switcher**
   - Add theme switcher dropdown in `components/editor/editor-navbar.tsx` with Sun / Moon / Sparkles icons.
   - Sync active theme with `localStorage` and `document.documentElement.setAttribute("data-theme", theme)`.

### Scope Limits

- Theme switching applies dynamically across the editor without requiring page reloads.

### Check When Done

- Switching to Light Mode displays crisp light theme suitable for documentation screenshots.
- Switching to OLED displays pitch-black contrast.
- Default dark mode preserves rich neon aesthetics.
- `npx tsc --noEmit` and `npm run lint` pass cleanly.
