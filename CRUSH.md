## Commands
- `npm run dev` - Start development server on port 8080
- `python -m http.server 8080` - Static server for production

## Code Style
- **File extensions**: Use `.js` (not `.jsx`) for proper MIME types on static servers
- **Imports**: Use CDN URLs for external dependencies (esm.sh)
- **Components**: Preact with htm template literals, not JSX
- **State management**: Custom hooks pattern, no external state libraries
- **Error handling**: Comprehensive error states with fallback mechanisms
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Comments**: JSDoc style for functions and hooks
- **Constants**: Define in `src/utils/constants.js` with UPPER_CASE naming