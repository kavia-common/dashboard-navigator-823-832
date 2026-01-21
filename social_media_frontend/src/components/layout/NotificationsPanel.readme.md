This panel is responsive:

- The panel itself can be collapsed using the Show/Hide button in its header.
- App layout remains a three-column grid on large screens. On viewports <= 1024px, the panel auto-collapses on mount. Users can open it when needed.
- Styling leverages App.css CSS variables for a modern light theme with subtle accents (#3B82F6, #F59E0B).

API:
- GET /notifications -> list of notifications (fallback to stub when unavailable)
- POST /interactions/like -> like a target
- POST /interactions/comment -> comment on a target

All public functions in src/api/notifications.js are documented and marked with PUBLIC_INTERFACE.
