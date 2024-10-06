// src/App.js

import React from 'react';
import Chatbot from './Chatbot';
import { Container, CssBaseline } from '@mui/material';

function App() {
  return (
    <Container component="main" maxWidth="md" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CssBaseline />
      <Chatbot />
    </Container>
  );
}

export default App;
