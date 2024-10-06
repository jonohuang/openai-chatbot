// src/Chatbot.js

import React, { useState } from 'react';
import { TextField, Button, Box, Paper, Typography, CircularProgress, Switch } from '@mui/material';
import { sendMessageToOpenAI } from './openaiService';

const Chatbot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [conversations, setConversations] = useState([]); // State for storing conversations
  const [currentConversation, setCurrentConversation] = useState(0); // State to track current conversation

  const formatResponse = (response) => {
    // Split the response into paragraphs and filter empty lines
    const paragraphs = response.split('\n').filter(line => line.trim() !== '').map((para, index) => (
      <Typography key={index} variant="body1" paragraph>
        {para}
      </Typography>
    ));
    
    return <>{paragraphs}</>; // Return formatted paragraphs as JSX elements
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
  
    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];
  
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);
  
    try {
      const openaiResponse = await sendMessageToOpenAI(input);
      
      // Log the response to see its structure
      console.log('OpenAI Response:', openaiResponse);
  
      // Ensure response is a string
      const botMessageContent = typeof openaiResponse === 'string' ? openaiResponse : JSON.stringify(openaiResponse);
      
      const botMessage = { role: 'assistant', content: botMessageContent };
  
      const finalMessages = [...updatedMessages, botMessage];
  
      setMessages(finalMessages);
      setLoading(false);
      
      // Save conversation when completed
      if (conversations[currentConversation]) {
        setConversations((prev) => {
          const updated = [...prev];
          updated[currentConversation] = finalMessages;
          return updated;
        });
      } else {
        setConversations((prev) => [...prev, finalMessages]);
      }
    } catch (error) {
      console.error('Error sending message to OpenAI:', error);
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleNewConversation = () => {
    setMessages([]); // Clear current messages
    setInput(''); // Clear input field
    setCurrentConversation(conversations.length); // Set to new conversation index
  };

  const handleSelectConversation = (index) => {
    setMessages(conversations[index]); // Load selected conversation
    setCurrentConversation(index); // Set as current conversation
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        width: '90%',
        maxWidth: '1000px', // Increased max width for sidebar
        margin: '0 auto',
        borderRadius: '10px',
        boxShadow: 3,
        backgroundColor: darkMode ? '#424242' : '#fff',
        color: darkMode ? '#fff' : '#000',
      }}
    >
      {/* Sidebar */}
      <Box
        sx={{
          width: '300px', // Fixed width for sidebar
          borderRight: '1px solid #ccc',
          padding: '10px',
          overflowY: 'scroll',
          backgroundColor: darkMode ? '#616161' : '#f5f5f5',
        }}
      >
        <Typography variant="h6">Conversations</Typography>
        <Button variant="contained" onClick={handleNewConversation} sx={{ marginBottom: 2 }}>
          New Conversation
        </Button>
        {conversations.map((_, index) => (
          <Button
            key={index}
            variant="outlined"
            onClick={() => handleSelectConversation(index)}
            sx={{ marginBottom: 1, width: '100%' }}
          >
            Conversation {index + 1}
          </Button>
        ))}
      </Box>

      {/* Chat Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
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
            backgroundColor: darkMode ? '#616161' : '#f5f5f5',
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
                  color: darkMode ? '#000' : '#000',
                  whiteSpace: 'pre-line', // Preserve line breaks in the response
                }}
              >
                {msg.role === 'assistant' ? formatResponse(msg.content) : msg.content}
              </Typography>
            </Box>
          ))}
          {loading && (
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
                backgroundColor: darkMode ? '#757575' : '#fff',
                color: darkMode ? '#fff' : '#000',
              },
            }}
          />
          <Button type="submit" variant="contained" color="primary">
            Send
          </Button>
        </form>
      </Box>
    </Box>
  );
};

export default Chatbot;
