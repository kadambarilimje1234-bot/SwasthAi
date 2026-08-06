const express = require('express');
const router = express.Router();
const { chatWithAI } = require('../services/chatService');
const { authenticate } = require('../middleware/auth');

// ============================================================
// POST /api/chat
// Description: Chat with AI Clinical Assistant (Authenticated)
// Body: { message: string, patientData: object }
// ============================================================
router.post('/', authenticate, async (req, res) => {
  try {
    const { message, patientData } = req.body;
    
    // Validation
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }
    
    console.log('💬 Chat Request (Auth):', { 
      message: message.substring(0, 50) + (message.length > 50 ? '...' : ''), 
      patientName: patientData?.name || 'None' 
    });
    
    // Get AI response from chatService
    const response = await chatWithAI(message.trim(), patientData);
    
    res.json({
      success: true,
      response: response,
    });
    
  } catch (error) {
    console.error('❌ Chat route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat request',
    });
  }
});

// ============================================================
// ✅ NEW: POST /api/chat/public
// Description: Chat with AI Clinical Assistant (Public - No Auth)
// Body: { message: string, patientData: object }
// ============================================================
router.post('/public', async (req, res) => {
  try {
    const { message, patientData } = req.body;
    
    // Validation
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }
    
    console.log('💬 Chat Request (Public):', { 
      message: message.substring(0, 50) + (message.length > 50 ? '...' : '')
    });
    
    // Get AI response from chatService
    const response = await chatWithAI(message.trim(), patientData);
    
    res.json({
      success: true,
      response: response,
    });
    
  } catch (error) {
    console.error('❌ Public chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat request',
    });
  }
});

// ============================================================
// GET /api/chat/health
// Description: Check if chat service is working
// ============================================================
router.get('/health', authenticate, (req, res) => {
  res.json({
    success: true,
    status: 'Chat service is running',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// POST /api/chat/clear
// Description: Clear chat history (optional)
// ============================================================
router.post('/clear', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Chat history cleared successfully',
  });
});

module.exports = router;