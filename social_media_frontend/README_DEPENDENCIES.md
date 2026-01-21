# Dependency installation note

If you encounter a build error like:
```
Module not found: Error: Can't resolve 'react-router-dom'
```
make sure dependencies are installed:

- npm install
- or ensure your CI step runs `npm ci` before building.

This project uses:
- react-router-dom v6 for routing
- react-scripts for CRA build tooling

