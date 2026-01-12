# HIZB.DEV AI Chat 🚀

A modern, feature-rich AI chat interface powered by **Puter.js** and built with **Next.js**. This application offers a seamless experience for interacting with various AI models and generating images, all within a beautiful "Glassmorphism" UI.

![Glassmorphism UI](https://img.shields.io/badge/UI-Glassmorphism-blueviolet)
![Next.js](https://img.shields.io/badge/Framework-Next.js-black)
![Puter.js](https://img.shields.io/badge/AI_Engine-Puter.js-blue)

## ✨ Features

- **Dual Mode Interface**: Easily toggle between **Chat Mode** and **Image Mode** (GPT-style).
- **Dynamic Model Selection**: Integration with Puter's list of available AI models (GPT-4o, Claude 3.5, etc.).
- **Image Generation**: Generate stunning images directly from text prompts using Puter's `txt2img` API.
- **Markdown Support**: Beautifully rendered AI responses with support for code highlighting, bold text, and lists.
- **Chat Persistence**: Your conversation history is saved locally in your browser.
- **Copy & Stop**: One-click copy for AI responses and the ability to stop generation mid-way.
- **Mobile Responsive**: Fully optimized for phones, tablets, and desktops.
- **Glassmorphism Design**: A premium, "transparent" look with vibrant gradients and blur effects.

## 🛠️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router, TypeScript)
- **AI SDK**: [Puter.js](https://puter.com/docs/js-sdk)
- **Styling**: Vanilla CSS (CSS Variables)
- **Markdown**: `react-markdown` with `remark-gfm`

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- A Puter account (for API access)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/hizbullah599/puter-ai-chat.git
   cd puter-ai-chat
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Static Export**:
   To generate a static version of the site (output to `/out`):
   ```bash
   npm run build
   ```

## 🏗️ Project Structure

- `src/app/page.tsx`: Main application logic and UI components.
- `src/app/globals.css`: The entire Glassmorphism design system.
- `src/app/layout.tsx`: Root layout including the Puter.js SDK script.
- `src/puter.d.ts`: TypeScript declarations for the `puter` global object.

## 🔑 Puter Integration

This app uses the Puter.js SDK for simplified AI access:
- `puter.ai.chat()`: Handles streaming text responses.
- `puter.ai.txt2img()`: Handles image generation.
- `puter.auth.isSignedIn()`: Manages user authentication.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ by [Hizb Dev](https://hizb.dev)
