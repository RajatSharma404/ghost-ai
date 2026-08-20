# Feature 44: Interactive Minimap & Grid Settings

Add an interactive canvas radar `<MiniMap />` and customizable grid settings (Dots, Lines, Cross, None) with snap-to-grid controls to improve canvas navigation and alignment ergonomics.

### Implementation

1. **Minimap**
   - Import `<MiniMap />` from `@xyflow/react`.
   - Render in the bottom-right corner with custom node coloring (`nodeColor` matching node fills or border accents, mask color for dark theme).
   - Toggleable via canvas controls button or hotkey `M`.

2. **Grid Settings**
   - Add Grid Settings popover in `canvas-controls.tsx`:
     - Background variant: **Dots**, **Lines**, **Cross Grid**, or **None**.
     - Grid Gap: 16px, 24px, 32px.
     - Snap to Grid toggle: `snapToGrid={snapToGrid}` with `snapGrid={[gap, gap]}`.

### Scope Limits

- Minimap and grid settings are local viewport preferences preserved during the active session.

### Check When Done

- Minimap renders node positions accurately and allows click-to-pan.
- Grid background updates instantly when switching variants.
- Snap-to-grid forces dragged nodes to align to grid coordinates.
- `npx tsc --noEmit` and `npm run lint` pass cleanly.
