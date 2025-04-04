require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize Gemini model for the chatbot
let geminiModel;
try {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set in environment variables. Chatbot will use fallback responses.");
  } else {
    console.log("Initializing Gemini model with API key");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
} catch (error) {
  console.error("Error initializing Gemini:", error);
}

// Hardcoded fallback information in case file reading fails
const fallbackInfo = {
  name: "Adarsh Shukla",
  title: "AI/ML Engineer",
  skills: "Machine Learning, Python, JavaScript, AI, Natural Language Processing, Computer Vision, RAG",
  education: "B.Tech, Computer Science and Engineering",
  experience: "3+ years of experience in AI and ML development"
};

// Simple fallback response function
function getFallbackResponse(query) {
  const fallbackResponses = [
    "I don't have specific information about that. You might want to ask Adarsh directly through the contact form.",
    "I don't have enough details to answer that question. Maybe check Adarsh's LinkedIn or GitHub for more information?",
    "I'm not sure about that. Feel free to reach out to Adarsh for more details.",
    "That's beyond what I know about Adarsh. You can email him for more information."
  ];
  
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

// Simple API endpoint to test if server is running
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Simulate the Netlify test function locally
app.all('/.netlify/functions/test', (req, res) => {
  res.json({
    message: "Test function is working locally!",
    timestamp: new Date().toISOString()
  });
});

// Simulate the Netlify chatbot function locally
app.post('/.netlify/functions/chatbot', async (req, res) => {
  const { query, sessionId } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }
  
  try {
    // Load content
    let resumeContent = '';
    let cvContent = '';
    
    try {
      if (fs.existsSync('./adarsh_resume.md')) {
        resumeContent = fs.readFileSync('./adarsh_resume.md', 'utf8');
      } else {
        console.log('Resume file not found, using fallback');
        resumeContent = JSON.stringify(fallbackInfo);
      }
      
      if (fs.existsSync('./cv_extracted.txt')) {
        cvContent = fs.readFileSync('./cv_extracted.txt', 'utf8');
      } else {
        console.log('CV file not found, using fallback');
        cvContent = JSON.stringify(fallbackInfo);
      }
    } catch (error) {
      console.error("Error reading content files:", error);
      resumeContent = JSON.stringify(fallbackInfo);
      cvContent = JSON.stringify(fallbackInfo);
    }
    
    // If Gemini is not initialized, return a fallback response
    if (!geminiModel) {
      console.log("Using fallback response (no Gemini model)");
      return res.json({ answer: getFallbackResponse(query) });
    }
    
    const systemPrompt = `You are an AI assistant for Adarsh Shukla's portfolio website. You should answer questions about Adarsh based on his CV and resume. Be helpful, concise, and professional.
    
    Resume: ${resumeContent}
    
    CV information: ${cvContent}
    
    If you don't know the answer to a question, politely say so rather than making up information.`;
    
    // Generate response with Gemini
    const result = await geminiModel.generateContent({
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "user", parts: [{ text: query }] }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    });
    
    const response = result.response.text();
    res.json({ answer: response || getFallbackResponse(query) });
    
  } catch (error) {
    console.error("Error processing chatbot request:", error);
    res.json({ 
      answer: `I'm having trouble generating a response right now. Please try again later. Error: ${error.message}`
    });
  }
});

// Catch any other API requests
app.all('/api/*', (req, res) => {
  res.status(200).send('This API endpoint is handled by Netlify Functions in production.');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the site`);
  console.log(`Netlify Functions are simulated at /.netlify/functions/`);
}); 