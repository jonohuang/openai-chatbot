# Chatbot Application

A chatbot application built with React. It lets users converse with an AI model powered by OpenAI, with saved conversations, model and tone settings, and light/dark themes. The UI follows the chatbot redesign handoff (design tokens, Gabarito/Figtree type, icon rail + slide-over history + centred thread + settings inspector).

## Features

- **Chat Interface**: Centred message thread with user/assistant bubbles and a typing indicator.
- **Empty State**: Suggestion chips ("Summarise a doc", "Draft an email", …) that send with one tap.
- **Conversation History**: Slide-over panel of saved conversations, auto-titled from the first message and persisted in the browser (localStorage).
- **New Conversation**: Start a fresh conversation at any time.
- **Model & Tone Settings**: Pick the OpenAI model (fast/smart) and reply tone (Balanced / Concise / Friendly).
- **Dark Mode**: Toggle between light and dark themes; the preference is remembered.
- **Mobile Layout**: Responsive header, history drawer with search and date groups, and a slide-over settings sheet.

## Technologies Used

- React
- OpenAI API
- Plain CSS with design tokens (no UI framework)

## Prerequisites

Make sure you have the following installed:

- Node.js (v14 or later)
- npm (Node Package Manager)

## Setup

Set your OpenAI API key in a `.env` file at the project root (get a key from the [OpenAI API keys page](https://platform.openai.com/api-keys)):

```
REACT_APP_OPENAI_API_KEY=your-key-here
```

`.env` is gitignored — never commit it or share the key value elsewhere.

## Running the Project

Install dependencies (first time only):

```
npm install
```

Start the development server:

```
npm start
```

The app opens at [http://localhost:3000](http://localhost:3000) and hot-reloads as you edit files in `src/`.

If `.env` changes while the dev server is running, restart it (`Ctrl+C` then `npm start`) — Create React App only reads `REACT_APP_*` variables at startup, not on hot-reload.

Other commands:

```
npm test          # run the test suite (watch mode; CI=true npm test for a single run)
npm run build     # production build into build/
```

## Troubleshooting

**Every message shows "(Couldn't reach the AI — try again in a moment.)"**

This is the app's fallback for any failed request to OpenAI. Open the browser console for the actual cause:

- **No request appears at all / key looks undefined**: `.env` is missing, misnamed, or the server hasn't been restarted since it was added.
- **`401 Unauthorized`**: the key value is invalid — check for typos, extra quotes, or that the key hasn't been revoked on the [API keys page](https://platform.openai.com/api-keys).
- **`429`**: with OpenAI this usually means `insufficient_quota` — check [Billing](https://platform.openai.com/settings/organization/billing/overview) for an active payment method or credit balance, rather than assuming it's a rate limit.

If a key is ever pasted somewhere it could be logged or shared (chat, screenshot, commit), treat it as compromised: revoke it and generate a new one.
