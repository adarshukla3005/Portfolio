require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// CV content extracted from the cv_extracted.txt file
const cvContent = `ADARSH SHUKLA
Third-year undergraduate student at IIT Roorkee
Mob: +91 8707446780 | Email: adarshukla3005@gmail.com | LinkedIn: linkedin.com/in/adarsh-shukla30

EDUCATION
B.Tech. in Engineering Physics
Indian Institute of Technology Roorkee (IITR)
2022 - 2026
Graduation CGPA/Grades: 7.2/10.0

Higher Secondary
B.B.S International School
2017 - 2021
High School Class 10th Percentage: 94.8%
Intermediate Class 12th Percentage: 84.6%

SKILLS & COMPETENCIES
Programming Languages: Python (Advanced), C++ (Intermediate), JavaScript (Basic)
Technologies & Frameworks: TensorFlow, PyTorch, Streamlit, FastAPI, Socket.IO, WebSockets, Docker
Tools & Databases: MongoDB, SQL, Git/GitHub, AWS, GCP, Kaggle
Areas of Expertise: Machine Learning, Deep Learning, Natural Language Processing, Computer Vision, RAG (Retrieval-Augmented Generation), Data Analysis, Statistical Modeling

PROJECTS
Multiple PDF Chatbot
- Developed a streamlit app that allows users to chat with multiple PDFs simultaneously
- Implemented RAG architecture with Gemini API for accurate document-based responses
- Created vector embeddings to maintain semantic relationships between document sections
- Optimized query routing to retrieve relevant information from large document sets
GitHub: https://github.com/adarshukla3005/Multiple-PDF-Chatbot

Cold Calling Agent Chatbot
- Built an AI agent that automates customer qualification calls using advanced NLP
- Implemented real-time speech-to-text and text-to-speech for natural conversations
- Integrated conversation flow management with dynamic response generation
- Created comprehensive call analytics and reporting system for performance tracking
GitHub: https://github.com/adarshukla3005/Cold_Calling_Agent_Chatbot

Stock Sentiment Analysis
- Created a machine learning model to predict stock market sentiment from news headlines
- Developed text preprocessing pipeline including tokenization, stemming and vectorization
- Implemented and compared various classification algorithms (Naive Bayes, SVM, LSTM)
- Achieved 86% accuracy in sentiment prediction from financial news data
GitHub: https://github.com/adarshukla3005/Stock-Sentiment-Analysis

Neural Style Transfer
- Implemented a CNN-based neural style transfer algorithm using TensorFlow
- Created an interface allowing users to apply artistic styles to their images
- Optimized the algorithm for faster processing while maintaining output quality
- Added multiple pre-trained style models for diverse artistic options
GitHub: https://github.com/adarshukla3005/Neural-Style-Transfer

Extreme Low-light Image Enhancement
- Developed a deep learning model to enhance extremely low-light images
- Implemented custom loss functions for improved perceptual quality
- Created dataset augmentation techniques for better model generalization
- Achieved significant improvement over state-of-the-art methods in PSNR metrics
GitHub: https://github.com/adarshukla3005/Low-Light-Enhancement

Search Engine for Blogs and Articles | Google Developer's Club, IITR
- Built a search engine that crawls personal blogs, filters content with ML models, and generates optimized indexes.
- Implemented hybrid BM25 + BERT semantic search for fast, and authentic retrieval across 10,000+ crawled pages.
- Developed a responsive web interface with query expansion, ranking boosts, relevance and optimized response time.
GitHub: https://github.com/adarshukla3005/SearchEngine

WORK EXPERIENCE
Summer Intern, IIT Roorkee
May 2023 - July 2023
- Worked on automatic segmentation of medical images using deep learning
- Implemented and optimized U-Net architecture for organ segmentation
- Developed data augmentation pipeline for improved model generalization
- Achieved 92% accuracy on test dataset, improving over baseline by 7%

Financial Analyst Intern, Awesome Advertising
July 2023 - August 2023
- Created a financial report generator using RAG architecture
- Automated data extraction from multiple sources for consolidated analysis
- Developed interactive dashboards for financial performance visualization
- Reduced manual reporting time by 75% through automation

AI Developer Intern | Epilepto Systems Pvt. Ltd.
- Worked on a Real Estate Assistant for conversational property search using AI agent and Natural Language queries.
- Integrated RAG with Pinecone and a Twilio WhatsApp chat to deliver context-sensitive property recommendations.
- Added user login, preference saving, history context, Real-time Web Scraping and automated document generation.
- Developed with Streamlit and FastAPI, powered by vector search and advanced retrieval workflows from database.

AI/ML Intern | Erudite IT Professional Pvt. Ltd.
- Worked on Sports Analytics Platform integrating match data, commentary, and fan engagements for real-time insights.
- Developed AI modules and hybrid RAG chatbot using NLP, BM25, and semantic search for context-aware sports analysis.
- Automated content generation, commentary, and dashboards with CI/CD pipelines, PostgreSQL, and voice-enabled UI.

CERTIFICATIONS
- Deep Learning Specialization - Coursera (by Andrew Ng)
- Machine Learning - Stanford Online
- Advanced NLP with TensorFlow - Udacity
- AWS Cloud Practitioner - Amazon Web Services

ACHIEVEMENTS
- Top 5% in National Science Olympiad 2021
- Runner-up in IIT Roorkee Hackathon 2023
- 3rd place in Inter-College Coding Competition

LANGUAGES
English (Professional), Hindi (Native)

INTERESTS
AI Research, Quantum Computing, Competitive Programming, Chess`;

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
    geminiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }
} catch (error) {
  console.error("Error initializing Gemini client:", error.message);
}

// Function to convert markdown to HTML
function markdownToHtml(text) {
  // Ensure text is a string and handle null/undefined cases
  text = String(text || '');
  
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

    // Create system prompt with hardcoded information and CV content
    const systemPrompt = `You are an AI assistant for Adarsh Shukla's portfolio website. You should answer questions about Adarsh based on this information. Be helpful, concise, and professional.
    
    Feel free to use Markdown formatting in your responses:
    - Use **text** for bold
    - Use *text* for italics
    - Use bullet lists with - to organize information
    
    Information about Adarsh:
    ${JSON.stringify(adarshInfo, null, 2)}
    
    CV information:
    ${cvContent}
    
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
    
    const response = result.response.text;
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
