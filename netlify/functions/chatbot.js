require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Hardcoded information about Adarsh
const adarshInfo = {
  name: "Adarsh Shukla",
  title: "AI/ML Engineer",
  skills: ["Machine Learning", "Python", "JavaScript", "AI", "Natural Language Processing", "Computer Vision", "RAG"],
  education: "B.Tech, Computer Science and Engineering",
  experience: "3+ years of experience in AI and ML development",
  projects: [
    {
      name: "Multiple PDF Chatbot",
      description: "A RAG-based chatbot that can answer questions based on multiple PDF documents."
    },
    {
      name: "Cold Calling Agent Chatbot",
      description: "An AI-powered chatbot designed to assist with cold calling."
    }
  ],
  about: "Experienced AI/ML Engineer specializing in building intelligent applications with a strong focus on RAG (Retrieval-Augmented Generation) systems."
};

// Initialize Google Generative AI (Gemini)
let geminiModel;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set in environment variables");
  } else {
    const genAI = new GoogleGenerativeAI(apiKey);
    geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }
} catch (error) {
  console.error("Error initializing Gemini client:", error.message);
}

// Function to convert markdown to HTML
function markdownToHtml(text) {
  if (!text) return '';
  
  // Convert **bold** to <strong>bold</strong>
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em>italic</em>
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert bullet points
  text = text.replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
  text = text.replace(/<li>(.*)<\/li>/g, '<ul><li>$1</li></ul>');
  
  // Convert line breaks
  text = text.replace(/\n/g, '<br>');
  
  return text;
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

    // Check if Gemini model is available
    if (!geminiModel) {
      console.error("Gemini model not initialized");
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          answer: getFallbackResponse(query),
          error: 'Gemini API not initialized'
        })
      };
    }

    // Create system prompt with hardcoded information
    const systemPrompt = `You are an AI assistant for Adarsh Shukla's portfolio website. You should answer questions about Adarsh based on this information. Be helpful, concise, and professional.
    
    Feel free to use Markdown formatting in your responses:
    - Use **text** for bold
    - Use *text* for italics
    - Use bullet lists with - to organize information
    
    Information about Adarsh:
    ${JSON.stringify(adarshInfo, null, 2)}
    
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
    // Convert markdown formatting to HTML
    const formattedResponse = markdownToHtml(response);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        answer: formattedResponse || getFallbackResponse(query)
      })
    };
  } catch (error) {
    console.error("Error processing request:", error);
    
    return {
      statusCode: 200, // Return 200 even on error so the client doesn't show an error
      body: JSON.stringify({ 
        answer: `I'm having trouble connecting to my knowledge base right now. Please try again later or contact Adarsh directly.`
      })
    };
  }
}; 