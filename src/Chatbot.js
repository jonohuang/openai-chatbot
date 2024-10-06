// src/Chatbot.js

import React, { useState } from 'react';
import { TextField, Button, Box, Paper, Typography, CircularProgress, Switch } from '@mui/material';
import { sendMessageToOpenAI } from './openaiService';

const Chatbot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false); // State for loading
  const [darkMode, setDarkMode] = useState(false); // State for dark mode

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true); // Set loading to true when a message is sent

    const openaiResponse = await sendMessageToOpenAI(input);
    const botMessage = { role: 'assistant', content: openaiResponse };

    setMessages((prevMessages) => [...prevMessages, botMessage]);
    setLoading(false); // Set loading to false when the response is received
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '90%', // Adjust width to 90% for smaller screens
        maxWidth: '600px', // Maintain a maximum width
        margin: '0 auto',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: 3,
        backgroundColor: darkMode ? '#424242' : '#fff', // Background color based on theme
        color: darkMode ? '#fff' : '#000', // Text color based on theme
        '@media (min-width:600px)': {
          width: '80%', // Change width to 80% on larger screens
        },
        '@media (min-width:960px)': {
          width: '70%', // Change width to 70% on even larger screens
        },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" align="center">
          Chatbot
        </Typography>
        <Box>
          <Typography variant="body1" sx={{ mr: 1 }}>
            Dark Mode
          </Typography>
          <Switch checked={darkMode} onChange={toggleDarkMode} />
        </Box>
      </Box>
      <Paper
        sx={{
          flex: 1,
          overflowY: 'scroll',
          padding: '10px',
          marginBottom: '10px',
          backgroundColor: darkMode ? '#616161' : '#f5f5f5', // Paper color based on theme
        }}
      >
        {messages.map((msg, index) => (
          <Box key={index} sx={{ textAlign: msg.role === 'user' ? 'right' : 'left', marginBottom: 1 }}>
            <Typography
              variant="body1"
              sx={{
                display: 'inline-block',
                padding: '10px',
                borderRadius: '5px',
                backgroundColor: msg.role === 'user' ? '#cfe9ff' : '#e0e0e0',
                color: darkMode ? '#000' : '#000', // Ensure text color is readable
              }}
            >
              {msg.content}
            </Typography>
          </Box>
        ))}
        {loading && ( // Show loading indicator when loading is true
          <Box sx={{ textAlign: 'center', marginTop: 2 }}>
            <CircularProgress />
          </Box>
        )}
      </Paper>
      <form onSubmit={handleSubmit} style={{ display: 'flex' }}>
        <TextField
          variant="outlined"
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          sx={{ marginRight: 1 }}
          InputProps={{
            style: {
              backgroundColor: darkMode ? '#757575' : '#fff', // Input background color
              color: darkMode ? '#fff' : '#000', // Input text color
            },
          }}
        />
        <Button type="submit" variant="contained" color="primary">
          Send
        </Button>
      </form>
    </Box>
  );
};

export default Chatbot;
