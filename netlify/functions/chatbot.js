require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Initialize Google Generative AI (Gemini)
let geminiModel;
try {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY");
  geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
} catch (error) {
  console.error("Error initializing Gemini client:", error.message);
}

// Load content from files
let resumeContent = '';
let cvContent = '';

try {
  const resumePath = path.join(__dirname, '../../adarsh_resume.md');
  if (fs.existsSync(resumePath)) {
    resumeContent = fs.readFileSync(resumePath, 'utf8');
  }
  
  const cvPath = path.join(__dirname, '../../cv_extracted.txt');
  if (fs.existsSync(cvPath)) {
    cvContent = fs.readFileSync(cvPath, 'utf8');
  }
} catch (error) {
  console.error("Error loading content:", error);
}

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

exports.handler = async function(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { query, sessionId } = body;
    
    if (!query) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing query parameter' })
      };
    }

    // Create system prompt with CV and resume content
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
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        answer: response || getFallbackResponse(query)
      })
    };
  } catch (error) {
    console.error("Error processing request:", error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message,
        answer: getFallbackResponse("error")
      })
    };
  }
}; 