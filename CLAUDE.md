# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a web-based chat interface for LLMs using OpenRouter's API. The application supports streaming responses, multiple models, markdown rendering with MathJax support, and real-time model switching.

## Common Commands

**Development Server:**
```bash
pip install livereload  # Install dependency first
python serve.py  # Starts livereload server on port 5500
```

**Run Application:**
Open `index.html` in a web browser or use the development server.

Note: No dependencies, build process, or package management needed. The web application runs directly from static files using CDN resources.

## Architecture

### Core Components

**ChatEngine (`chat-engine.js`):**
- Main chat logic with streaming support
- Built-in state management using custom Store class
- Handles OpenRouter API communication
- Supports both streaming and fallback non-streaming modes
- Manages message history and model switching

**Frontend (`editor.js`):**
- DOM manipulation and UI event handling
- Two display modes: markdown (with MathJax) and plain text
- Real-time message streaming updates
- Model selection and API key management

**Model Management (`fetch-models.js`):**
- Fetches available models from OpenRouter API
- Populates dropdown with all available models
- Default model: `openai/gpt-4o-mini`

### Key Features
- **Streaming Support**: Real-time message streaming with fallback
- **Math Rendering**: MathJax support for LaTeX math expressions
- **Model Switching**: Dynamic model switching without page reload
- **Responsive Design**: Uses Tailwind CSS for responsive layout
- **State Management**: Custom Store class with subscription-based updates

### File Structure
- `index.html` - Main web interface
- `chat-engine.js` - Core chat functionality and API communication
- `editor.js` - Frontend UI logic and event handling
- `fetch-models.js` - Model fetching and dropdown population
- `defaults.js` - Default system prompt configuration
- `serve.py` - Development server with livereload
- `styles.css` - Custom CSS styles

### API Integration
- Uses OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`)
- Requires API key for authentication
- Supports streaming responses via Server-Sent Events
- Handles CORS properly with HTTP-Referer headers

### Development Notes
- ES6 modules used throughout
- No build pipeline - runs directly in browser
- Uses CDN resources for dependencies (markdown-it, Tailwind, MathJax)
- Livereload server watches main JS files for changes