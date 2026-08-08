// src/openaiService.js

import axios from 'axios';

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

export const sendMessageToOpenAI = async (messages, { model = 'gpt-4o-mini', system } = {}) => {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        ...messages.map(({ role, content }) => ({ role, content })),
      ],
      max_tokens: 1024,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data.choices[0].message.content;
};
