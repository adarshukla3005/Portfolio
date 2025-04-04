require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
// Replace OpenAI with Google Generative AI
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cheerio = require('cheerio');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Initialize Google Generative AI (Gemini)
let geminiModel;
let embeddingModel;
try {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY is not set in environment variables");
  } else {
    console.log("Initializing Gemini client with API key");
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY");
  
  // Get the models
  geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
  
  console.log("Gemini client initialized successfully");
} catch (error) {
  console.error("Error initializing Gemini client:", error.message, error.stack);
}

// Track file modification times
let lastCVModified = 0;
let lastResumeModified = 0;

// Function to get file modification time
function getFileModTime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtimeMs;
  } catch (error) {
    console.error(`Error getting file modification time for ${filePath}:`, error);
    return 0;
  }
}

// Simple vector similarity function
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// In-memory vector store
class InMemoryVectorStore {
  constructor() {
    this.documents = [];
  }
  
  addDocuments(documents) {
    this.documents.push(...documents);
  }
  
  similaritySearch(query, k = 5) {
    // Sort documents by similarity
    const results = [...this.documents]
      .map(doc => ({
        ...doc,
        similarity: cosineSimilarity(query, doc.embedding)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);
    
    return results;
  }
}

// Session history manager
class SessionManager {
  constructor() {
    this.sessions = new Map();
    
    // Clean up inactive sessions every hour
    setInterval(() => this.cleanupInactiveSessions(), 60 * 60 * 1000);
  }
  
  getSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        history: [],
        lastActive: Date.now()
      });
    } else {
      // Update last active timestamp
      const session = this.sessions.get(sessionId);
      session.lastActive = Date.now();
      this.sessions.set(sessionId, session);
    }
    
    return this.sessions.get(sessionId);
  }
  
  addMessage(sessionId, role, content) {
    const session = this.getSession(sessionId);
    session.history.push({ role, content });
    this.sessions.set(sessionId, session);
  }
  
  getHistory(sessionId) {
    return this.getSession(sessionId).history;
  }
  
  clearSession(sessionId) {
    if (this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId);
      session.history = [];
      this.sessions.set(sessionId, session);
    }
  }
  
  cleanupInactiveSessions() {
    const now = Date.now();
    const INACTIVE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActive > INACTIVE_THRESHOLD) {
        this.sessions.delete(sessionId);
        console.log(`Cleaned up inactive session: ${sessionId}`);
      }
    }
  }
}

// Create a model for the chatbot
class PortfolioChatbot {
  constructor() {
    this.initialized = false;
    this.vectorStore = new InMemoryVectorStore();
    this.resumeContent = '';
    this.pdfContent = '';
    this.websiteContent = '';
    this.sessionManager = new SessionManager();
    
    // Set up file monitoring
    this.setupFileMonitoring();
  }
  
  setupFileMonitoring() {
    // Check for changes every 30 seconds
    setInterval(() => this.checkContentUpdates(), 30 * 1000);
  }
  
  async checkContentUpdates() {
    try {
      // Check CV extracted text file
      if (fs.existsSync('cv_extracted.txt')) {
        const currentModTime = getFileModTime('cv_extracted.txt');
        if (currentModTime > lastCVModified) {
          console.log('CV file has been modified, reloading content...');
          await this.extractPDFContent(true);
          lastCVModified = currentModTime;
        }
      }
      
      // Check resume markdown file
      if (fs.existsSync('adarsh_resume.md')) {
        const currentModTime = getFileModTime('adarsh_resume.md');
        if (currentModTime > lastResumeModified) {
          console.log('Resume file has been modified, reloading content...');
          await this.loadResumeContent(true);
          lastResumeModified = currentModTime;
        }
      }
    } catch (error) {
      console.error('Error checking for content updates:', error);
    }
  }

  async initialize() {
    if (this.initialized) return;

    try {
      console.log('Initializing in-memory vector store...');
      // Load all content sources
      await this.loadResumeContent();
      await this.extractPDFContent();
      await this.extractWebsiteContent();
      
      // Set initial modification times
      if (fs.existsSync('cv_extracted.txt')) {
        lastCVModified = getFileModTime('cv_extracted.txt');
      }
      if (fs.existsSync('adarsh_resume.md')) {
        lastResumeModified = getFileModTime('adarsh_resume.md');
      }
      
      this.initialized = true;
      console.log('Chatbot initialized successfully');
    } catch (error) {
      console.error('Error initializing chatbot:', error);
      throw error;
    }
  }

  async loadResumeContent(isReload = false) {
    try {
      console.log('Loading resume content from markdown file...');
      
      // Clear old content if reloading
      if (isReload) {
        this.resumeContent = '';
        // Remove old resume vectors from the store
        this.vectorStore.documents = this.vectorStore.documents.filter(
          doc => !doc.id.startsWith('header') && !doc.id.includes('-section-')
        );
      }
      
      // Read the resume markdown file
      if (fs.existsSync('adarsh_resume.md')) {
        this.resumeContent = fs.readFileSync('adarsh_resume.md', 'utf-8');
        console.log('Resume content loaded successfully');
        
        // Split the resume into sections for better retrieval
        await this.indexResumeContent();
      } else {
        console.error('Resume markdown file not found');
        throw new Error('Resume markdown file not found');
      }
    } catch (error) {
      console.error('Error loading resume content:', error);
      throw error;
    }
  }

  async extractPDFContent(isReload = false) {
    try {
      console.log('Extracting content from PDF...');
      
      // Clear old content if reloading
      if (isReload) {
        this.pdfContent = '';
        // Remove old PDF vectors from the store
        this.vectorStore.documents = this.vectorStore.documents.filter(
          doc => !doc.id.includes('pdf-chunk') && doc.metadata.type !== 'PDF CV'
        );
      }
      
      // Check if the text extraction file exists
      if (fs.existsSync('cv_extracted.txt')) {
        this.pdfContent = fs.readFileSync('cv_extracted.txt', 'utf-8');
        console.log('PDF content loaded from extracted text file');
        
        // Index the PDF content
        await this.indexPDFContent();
      } else if (fs.existsSync('Adarsh_Shukla_CV.pdf')) {
        console.log('PDF extraction requires additional setup. Using markdown resume instead.');
      } else {
        console.log('PDF file not found, skipping PDF extraction');
      }
    } catch (error) {
      console.error('Error extracting PDF content:', error);
      console.log('Continuing without PDF content');
    }
  }

  async extractWebsiteContent() {
    try {
      console.log('Extracting content from website HTML...');
      // Read the index.html file
      if (fs.existsSync('index.html')) {
        const htmlContent = fs.readFileSync('index.html', 'utf-8');
        
        // Use cheerio to parse HTML content
        const $ = cheerio.load(htmlContent);
        
        // Extract text content from important sections
        const sections = [];
        
        // Extract navbar sections as indicators of main content areas
        $('.nav-link').each((i, elem) => {
          const sectionName = $(elem).text().trim();
          if (sectionName && sectionName !== 'Chat') {
            sections.push({
              id: `website-section-${sectionName.toLowerCase().replace(/\s+/g, '-')}`,
              title: sectionName,
              content: `## ${sectionName}`
            });
          }
        });
        
        // Extract content from project cards
        $('.card').each((i, elem) => {
          const title = $(elem).find('.card-title').text().trim();
          const text = $(elem).find('.card-text').text().trim();
          if (title) {
            const content = `### ${title}\n${text}`;
            sections.push({
              id: `website-project-${i}`,
              title: title,
              content: content
            });
          }
        });
        
        // Extract education section
        const education = [];
        $('.timeline-item').each((i, elem) => {
          const degree = $(elem).find('.timeline-title').text().trim();
          const institution = $(elem).find('.timeline-place').text().trim();
          const time = $(elem).find('.timeline-date span').text().trim();
          const description = $(elem).find('p').text().trim();
          
          if (degree && institution) {
            education.push(`### ${degree} - ${institution} (${time})\n${description}`);
          }
        });
        
        if (education.length > 0) {
          sections.push({
            id: 'website-education',
            title: 'Education',
            content: `## Education\n${education.join('\n\n')}`
          });
        }
        
        // Extract skills
        const skills = [];
        $('.skill-item').each((i, elem) => {
          const skillName = $(elem).find('h3').text().trim();
          const skillLevel = $(elem).find('.progress-bar').attr('aria-valuenow');
          
          if (skillName) {
            skills.push(`### ${skillName} ${skillLevel ? `(${skillLevel}%)` : ''}`);
          }
        });
        
        if (skills.length > 0) {
          sections.push({
            id: 'website-skills',
            title: 'Skills',
            content: `## Skills\n${skills.join('\n')}`
          });
        }
        
        // Extract contact information
        const contactInfo = $('address').text().trim();
        if (contactInfo) {
          sections.push({
            id: 'website-contact',
            title: 'Contact',
            content: `## Contact\n${contactInfo}`
          });
        }
        
        // Combine all sections into website content
        this.websiteContent = sections.map(section => section.content).join('\n\n');
        console.log('Website content extracted successfully');
        
        // Index website content
        for (const section of sections) {
          await this.indexWebsiteSection(section);
        }
      } else {
        console.log('HTML file not found, skipping website extraction');
      }
    } catch (error) {
      console.error('Error extracting website content:', error);
      console.log('Continuing without website content');
    }
  }

  async indexPDFContent() {
    try {
      console.log('Indexing PDF content...');
      
      // Split the PDF content into manageable chunks
      const chunks = this.chunkText(this.pdfContent, 1000, 200);
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        await this.indexContent({
          id: `pdf-chunk-${i}`,
          content: chunk,
          metadata: { type: 'PDF CV' }
        });
      }
      
      console.log('PDF content indexed successfully');
    } catch (error) {
      console.error('Error indexing PDF content:', error);
    }
  }

  async indexWebsiteSection(section) {
    try {
      await this.indexContent({
        id: section.id,
        content: section.content,
        metadata: { type: 'Website', section: section.title }
      });
      
      console.log(`Indexed website section: ${section.title}`);
    } catch (error) {
      console.error(`Error indexing website section ${section.title}:`, error);
    }
  }

  // Helper function to chunk text into manageable pieces with overlap
  chunkText(text, chunkSize, overlap) {
    const chunks = [];
    const words = text.split(/\s+/);
    
    for (let i = 0; i < words.length; i += chunkSize - overlap) {
      const chunk = words.slice(i, i + chunkSize).join(' ');
      chunks.push(chunk);
    }
    
    return chunks;
  }

  async indexResumeContent() {
    try {
      // Split the resume into sections based on markdown headers
      const sections = [];
      const lines = this.resumeContent.split('\n');
      
      let currentSection = '';
      let currentContent = [];
      let currentId = 'header';
      
      for (const line of lines) {
        if (line.startsWith('## ')) {
          // Save previous section if it exists
          if (currentContent.length > 0) {
            sections.push({
              id: currentId,
              content: currentContent.join('\n'),
              metadata: { type: currentSection }
            });
          }
          
          // Start new section
          currentSection = line.replace('## ', '').trim();
          currentId = currentSection.toLowerCase().replace(/\s+/g, '-');
          currentContent = [line];
        } else {
          currentContent.push(line);
        }
      }
      
      // Add the last section
      if (currentContent.length > 0) {
        sections.push({
          id: currentId,
          content: currentContent.join('\n'),
          metadata: { type: currentSection }
        });
      }
      
      // Index each section
      for (const section of sections) {
        if (section.content.length > 0) {
          await this.indexContent(section);
        }
      }
      
      console.log('Resume content indexed successfully');
    } catch (error) {
      console.error('Error indexing resume content:', error);
      throw error;
    }
  }

  cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
  }

  async indexContent(section) {
    try {
      // Get embeddings for section content using Gemini
      console.log(`Getting embeddings for section ${section.id}...`);
      
      // Get embeddings using Gemini embedding model
      const embeddingResult = await embeddingModel.embedContent(section.content);
      
      const embedding = embeddingResult.embedding.values;
      console.log(`Got embedding of length: ${embedding.length} for section ${section.id}`);
      
      // Add to in-memory vector store
      this.vectorStore.addDocuments([{
        id: section.id,
        content: section.content,
        embedding: embedding,
        metadata: section.metadata
      }]);
      
      console.log(`Indexed section: ${section.id}`);
    } catch (error) {
      console.error(`Error indexing content for section ${section.id}:`, error.message, error.stack);
      throw error;
    }
  }

  async query(userQuery, sessionId) {
    try {
      console.log(`Starting query process for session ${sessionId}: ${userQuery}`);
      
      // If no sessionId is provided, generate a random one
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15);
        console.log(`Generated session ID: ${sessionId}`);
      }
      
      // Add user message to history
      this.sessionManager.addMessage(sessionId, "user", userQuery);
      
      // Get conversation history
      const history = this.sessionManager.getHistory(sessionId);
      const conversationContext = history.length > 1 
        ? `Previous conversation:\n${history.slice(0, -1).map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\n` 
        : '';
      
      // Fast answer from CV or Resume - check if we can quickly answer without embeddings
      const fastAnswer = this.getFastAnswerFromCV(userQuery);
      if (fastAnswer) {
        console.log("Found fast answer from CV/Resume");
        // Add assistant message to history
        this.sessionManager.addMessage(sessionId, "assistant", fastAnswer);
        console.log("Fast answer provided");
        return { response: fastAnswer, sessionId };
      }
      
      // If no fast answer, proceed with embedding-based search
      console.log("No fast answer found, proceeding with embedding search");
      
      // Get embeddings for user query
      let queryEmbedding;
      try {
        console.log("Getting embeddings for query using Gemini...");
        
        // Get embeddings using Gemini embedding model
        const embeddingResult = await embeddingModel.embedContent(userQuery);
        
        queryEmbedding = embeddingResult.embedding.values;
        console.log("Got embedding of length:", queryEmbedding.length);
      } catch (error) {
        console.error('Error getting embeddings, using fallback:', error.message, error.stack);
        // If embeddings fail, return a direct response based on the query
        const fallbackResponse = getFallbackResponse(userQuery);
        this.sessionManager.addMessage(sessionId, "assistant", fallbackResponse);
        return { response: fallbackResponse, sessionId };
      }
      
      // Search the vector store with prioritized metadata types
      let searchResults;
      try {
        console.log("Searching vector store with prioritization...");
        
        // First, try to get results from CV/Resume content specifically
        const cvResults = this.vectorStore.documents
          .filter(doc => doc.metadata.type === 'PDF CV' || doc.id.includes('pdf-chunk'))
          .map(doc => ({
            ...doc,
            similarity: cosineSimilarity(queryEmbedding, doc.embedding)
          }))
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 4);
        
        // Next, try to get results from markdown resume
        const resumeResults = this.vectorStore.documents
          .filter(doc => !doc.metadata.type.includes('Website')) // Exclude website content
          .map(doc => ({
            ...doc,
            similarity: cosineSimilarity(queryEmbedding, doc.embedding)
          }))
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 3);
        
        // Finally, include some website results if needed
        const websiteResults = this.vectorStore.documents
          .filter(doc => doc.metadata.type === 'Website')
          .map(doc => ({
            ...doc,
            similarity: cosineSimilarity(queryEmbedding, doc.embedding)
          }))
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 2);
        
        // Combine results with preference to CV/Resume content
        searchResults = [...cvResults, ...resumeResults];
        
        // Only add website results if we don't have enough from other sources
        if (searchResults.length < 5) {
          searchResults = [...searchResults, ...websiteResults];
        }
        
        // Sort by similarity again
        searchResults = searchResults
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 8);
        
        console.log("Found similar documents:", searchResults.length);
        console.log("Document types:", searchResults.map(r => r.metadata.type).join(', '));
      } catch (error) {
        console.error('Error searching vector store, using fallback:', error.message, error.stack);
        const fallbackResponse = getFallbackResponse(userQuery);
        this.sessionManager.addMessage(sessionId, "assistant", fallbackResponse);
        return { response: fallbackResponse, sessionId };
      }
      
      // Extract relevant content from search results
      const relevantContent = searchResults
        .map(doc => doc.content)
        .join('\n\n');
      
      console.log("Retrieved relevant content.");
      
      // Combine all available content sources, prioritizing the most relevant ones
      let combinedContent = relevantContent;
      
      // If relevant content is too short, add more context - prioritizing CV/resume
      if (!relevantContent || relevantContent.length < 200) {
        let addedContent = [];
        
        if (this.pdfContent && this.pdfContent.length > 0) {
          // Add CV content first (prioritized)
          addedContent.push("# CV Content\n" + this.pdfContent);
        }
        
        if (this.resumeContent) {
          // Add resume content second
          addedContent.push("# Resume Content\n" + this.resumeContent);
        }
        
        if (addedContent.length === 0 && this.websiteContent && this.websiteContent.length > 0) {
          // Only add website content if no CV/resume content is available
          addedContent.push("# Website Content\n" + this.websiteContent);
        }
        
        combinedContent = addedContent.join("\n\n----------\n\n");
      }
      
      // Generate response using Gemini with conversation history
      try {
        console.log("Generating completion with Gemini...");
        
        // Create a chat with history
        const chatHistory = history.map(msg => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        })).slice(0, -1); // Exclude the last user message which we'll add separately
        
        // Create a chat prompt
        const promptText = `You are a helpful portfolio assistant for Adarsh Shukla. Answer questions about Adarsh's portfolio based on the following content. Give structured, precise responses.
        
Provide detailed, informative responses that showcase Adarsh's skills, experience, and projects. Use a professional, clear writing style with proper paragraphs.

IMPORTANT: 
1. Make all important points, skills, tech stack items, project names, and key achievements appear in bold text using HTML <b> tags (not markdown).
2. When users ask about projects, include the GitHub link to the specific project.
3. Prioritize information from the CV/resume over website content.
4. Keep responses concise but complete - aim for 3-5 sentences when possible.
5. Format lists clearly with bullet points when appropriate.

For example, write "Adarsh is skilled in <b>Python</b>, <b>Machine Learning</b>, and <b>AI techniques</b>".

Remember previous questions in this conversation to provide more context-aware responses.

If you don't know the answer, say so honestly but try to be helpful.

Portfolio Content:
${combinedContent}

${conversationContext ? `${conversationContext}` : ''}
User question: ${userQuery}`;
        
        const generationConfig = {
          temperature: 0.7,
          maxOutputTokens: 800,
        };
        
        // Use chat API with history if available, otherwise use single-turn generation
        let result;
        if (chatHistory.length > 0) {
          // Create a chat session with history
          const chat = geminiModel.startChat({
            history: chatHistory,
            generationConfig,
          });
          
          // Send the latest message
          result = await chat.sendMessage(promptText);
        } else {
          // Generate content with Gemini for single-turn conversation
          result = await geminiModel.generateContent({
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            generationConfig,
          });
        }
        
        const response = result.response;
        let text = response.text();
        
        // Clean up markdown formatting but preserve HTML bold tags
        text = text.replace(/\*\*/g, '').replace(/\*/g, '');
        
        // Add assistant message to history
        this.sessionManager.addMessage(sessionId, "assistant", text);
        
        console.log("Completion successful.");
        return { response: text, sessionId };
      } catch (error) {
        console.error('Error generating Gemini completion, using fallback:', error.message, error.stack);
        const fallbackResponse = getFallbackResponse(userQuery);
        
        // Add fallback response to history
        this.sessionManager.addMessage(sessionId, "assistant", fallbackResponse);
        
        return { response: fallbackResponse, sessionId };
      }
    } catch (error) {
      console.error('Error in main query function, using fallback:', error.message, error.stack);
      const fallbackResponse = getFallbackResponse(userQuery);
      
      // Add fallback response to history if sessionId exists
      if (sessionId) {
        this.sessionManager.addMessage(sessionId, "assistant", fallbackResponse);
      }
      
      return { response: fallbackResponse, sessionId: sessionId || null };
    }
  }
  
  clearSessionHistory(sessionId) {
    if (sessionId) {
      this.sessionManager.clearSession(sessionId);
      console.log(`Cleared history for session ${sessionId}`);
      return true;
    }
    return false;
  }

  // Add a method to quickly check if we can answer from CV/resume without embeddings
  getFastAnswerFromCV(query) {
    // Convert query to lowercase for case-insensitive matching
    const q = query.toLowerCase();
    
    // Personal information queries
    if (q.includes('contact') || q.includes('email') || q.includes('phone') || q.includes('linkedin')) {
      return "You can contact Adarsh at <b>adarshukla3005@gmail.com</b> or <b>+91 8707446780</b>. His LinkedIn profile is <b>linkedin.com/in/adarsh-shukla30</b>. He's currently based in <b>Uttarakhand, India</b>.";
    }
    
    // Education queries
    if (q.includes('education') || q.includes('college') || q.includes('university') || q.includes('school') || q.includes('academic')) {
      return "Adarsh is pursuing <b>B.Tech. in Engineering Physics</b> at <b>Indian Institute of Technology Roorkee (IITR)</b> from 2022-2026 with a CGPA of <b>7.1/10.0</b>. He completed his higher secondary education at <b>B.B.S International School</b> with <b>94.8%</b> in Class 10th and <b>84.6%</b> in Class 12th.";
    }
    
    // CGPA specific query
    if (q.includes('cgpa') || q.includes('grade') || (q.includes('graduation') && q.includes('score'))) {
      return "Adarsh's current CGPA at IIT Roorkee is <b>7.1/10.0</b> in his B.Tech. in Engineering Physics program.";
    }
    
    // Percentage in 12th/intermediate specific query
    if ((q.includes('12th') || q.includes('intermediate') || q.includes('higher secondary')) && 
        (q.includes('percentage') || q.includes('score') || q.includes('marks'))) {
      return "Adarsh scored <b>84.6%</b> in his Intermediate (Class 12th) from B.B.S International School.";
    }
    
    // Percentage in 10th specific query
    if ((q.includes('10th') || q.includes('high school')) && 
        (q.includes('percentage') || q.includes('score') || q.includes('marks'))) {
      return "Adarsh scored <b>94.8%</b> in his High School (Class 10th) from B.B.S International School.";
    }
    
    // Skills queries
    if (q.includes('skill') || q.includes('expertise') || q.includes('proficient') || q.includes('good at')) {
      return "Adarsh is skilled in <b>Python (Advanced)</b>, <b>C++ (Intermediate)</b>, and <b>JavaScript (Basic)</b>. He's proficient with <b>TensorFlow</b>, <b>PyTorch</b>, <b>Streamlit</b>, <b>FastAPI</b>, <b>WebSockets</b>, and <b>Docker</b>. His areas of expertise include <b>Machine Learning</b>, <b>Deep Learning</b>, <b>NLP</b>, <b>Computer Vision</b>, <b>RAG</b>, and <b>Data Analysis</b>.";
    }
    
    // Projects - specific project queries
    if (q.includes('pdf chatbot') || q.includes('multiple pdf')) {
      return "Adarsh's <b>Multiple PDF Chatbot</b> project is a Streamlit app that allows users to chat with multiple PDFs simultaneously. It uses <b>RAG architecture</b> with <b>Gemini API</b> for accurate document-based responses, creates vector embeddings for semantic relationships, and optimizes query routing. GitHub: <b>https://github.com/adarshukla3005/Multiple-PDF-Chatbot</b>";
    }
    
    if (q.includes('cold calling') || q.includes('agent chatbot')) {
      return "Adarsh's <b>Cold Calling Agent Chatbot</b> is an AI agent that automates customer qualification calls using <b>advanced NLP</b>. It features real-time speech-to-text and text-to-speech, conversation flow management, and call analytics. GitHub: <b>https://github.com/adarshukla3005/Cold_Calling_Agent_Chatbot</b>";
    }
    
    if (q.includes('stock sentiment') || q.includes('sentiment analysis')) {
      return "Adarsh's <b>Stock Sentiment Analysis</b> project uses <b>machine learning</b> to predict stock market sentiment from news headlines. It includes text preprocessing, various classification algorithms (Naive Bayes, SVM, LSTM), and achieved <b>86% accuracy</b>. GitHub: <b>https://github.com/adarshukla3005/Stock-Sentiment-Analysis</b>";
    }
    
    if (q.includes('neural style') || q.includes('style transfer')) {
      return "Adarsh's <b>Neural Style Transfer</b> project implements a CNN-based algorithm using <b>TensorFlow</b> that allows users to apply artistic styles to their images. It's optimized for faster processing while maintaining quality, with multiple pre-trained style models. GitHub: <b>https://github.com/adarshukla3005/Neural-Style-Transfer</b>";
    }
    
    if (q.includes('low light') || q.includes('image enhancement')) {
      return "Adarsh's <b>Extreme Low-light Image Enhancement</b> project is a deep learning model that enhances extremely low-light images using custom loss functions and dataset augmentation techniques. It achieved significant improvement over state-of-the-art methods in PSNR metrics. GitHub: <b>https://github.com/adarshukla3005/Low-Light-Enhancement</b>";
    }
    
    // General projects query
    if (q.includes('project') || q.includes('work')) {
      return "Adarsh has worked on several impressive projects including: 1) <b>Multiple PDF Chatbot</b> using RAG and Gemini API, 2) <b>Cold Calling Agent Chatbot</b> with speech capabilities, 3) <b>Stock Sentiment Analysis</b> (86% accuracy), 4) <b>Neural Style Transfer</b> using TensorFlow, and 5) <b>Extreme Low-light Image Enhancement</b>. All projects are available on GitHub: <b>https://github.com/adarshukla3005/</b>";
    }
    
    // Work experience queries
    if (q.includes('work experience') || q.includes('intern') || q.includes('job')) {
      return "Adarsh completed a <b>Summer Internship at IIT Roorkee</b> (May-July 2023) working on <b>automatic segmentation of medical images</b> using deep learning, achieving 92% accuracy. He also worked as a <b>Financial Analyst Intern at Awesome Advertising</b> (July-Aug 2023) where he created a financial report generator using RAG architecture.";
    }
    
    // Certifications
    if (q.includes('certification') || q.includes('course') || q.includes('learn')) {
      return "Adarsh has completed certifications in <b>Deep Learning Specialization</b> by Andrew Ng on Coursera, <b>Machine Learning</b> from Stanford Online, <b>Advanced NLP with TensorFlow</b> from Udacity, and is an <b>AWS Cloud Practitioner</b>.";
    }
    
    // Achievements
    if (q.includes('achievement') || q.includes('award') || q.includes('recognition')) {
      return "Adarsh's achievements include placing in the <b>Top 5% in National Science Olympiad 2021</b>, <b>Runner-up in IIT Roorkee Hackathon 2023</b>, and <b>3rd place in Inter-College Coding Competition</b>.";
    }
    
    // Technical skills and programming
    if (q.includes('programming') || q.includes('coding') || q.includes('language') || q.includes('tech stack')) {
      return "Adarsh's technical skills include <b>Python (Advanced)</b>, <b>C++ (Intermediate)</b>, and <b>JavaScript (Basic)</b>. His tech stack includes <b>TensorFlow</b>, <b>PyTorch</b>, <b>Streamlit</b>, <b>FastAPI</b>, <b>Socket.IO</b>, <b>WebSockets</b>, <b>Docker</b>, <b>MongoDB</b>, <b>SQL</b>, <b>Git/GitHub</b>, <b>AWS</b>, and <b>GCP</b>.";
    }
    
    // Languages
    if (q.includes('language') && (q.includes('speak') || q.includes('communication'))) {
      return "Adarsh is fluent in <b>English (Professional)</b> and <b>Hindi (Native)</b>.";
    }
    
    // Interests
    if (q.includes('interest') || q.includes('hobby') || q.includes('passionate about')) {
      return "Adarsh is interested in <b>AI Research</b>, <b>Quantum Computing</b>, <b>Competitive Programming</b>, and <b>Chess</b>.";
    }
    
    // Codeforces/competitive programming specific
    if (q.includes('codeforces') || q.includes('competitive programming') || q.includes('coding competition')) {
      return "Based on available information, Adarsh has experience with <b>Competitive Programming</b> and lists it among his interests. He also achieved <b>3rd place in an Inter-College Coding Competition</b>. However, specific details about his Codeforces rating are not mentioned in the portfolio.";
    }
    
    // No fast answer found
    return null;
  }
}

// Initialize chatbot
const chatbot = new PortfolioChatbot();

// API Routes
// Chatbot endpoint
app.post('/api/chatbot', async (req, res) => {
  try {
    const { query, sessionId } = req.body;
    console.log(`Received query from session ${sessionId}: ${query}`);
    
    // Make sure chatbot is initialized
    if (!chatbot.initialized) {
      await chatbot.initialize();
    }
    
    // Get response from chatbot
    const result = await chatbot.query(query, sessionId);
    
    // Sending response with session ID
    res.json(result);
  } catch (error) {
    console.error('Error processing chatbot query:', error);
    
    // Use fallback response if there's an error
    const fallbackResponse = getFallbackResponse(req.body.query);
    console.log("Using fallback response.");
    res.json({ response: fallbackResponse, sessionId: req.body.sessionId });
  }
});

// Add endpoint to clear session history
app.post('/api/clear-session', (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }
  
  const success = chatbot.clearSessionHistory(sessionId);
  
  if (success) {
    res.json({ message: 'Session cleared successfully' });
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Create an API endpoint to force reload content
app.post('/api/reload-content', (req, res) => {
  try {
    // Force check for content updates
    chatbot.checkContentUpdates();
    res.json({ message: 'Content reload initiated' });
  } catch (error) {
    console.error('Error reloading content:', error);
    res.status(500).json({ error: 'Failed to reload content' });
  }
});

// Helper function for fallback responses
function getFallbackResponse(query) {
  const q = query.toLowerCase();
  
  if (q.includes('project') || q.includes('work')) {
    return "Adarsh has worked on several impressive projects including: 1) <b>Multiple PDF Chatbot</b> using <b>Gemini API</b>, 2) <b>Cold Calling Agent Chatbot</b>, 3) <b>Stock Sentiment Analysis</b> using <b>Machine Learning</b>, 4) <b>Neural Style Transfer</b>, and 5) <b>Extreme Low-light Image Enhancement</b>. He's especially skilled in <b>AI</b> and <b>machine learning</b> applications.";
  } else if (q.includes('skill') || q.includes('experience') || q.includes('expertise')) {
    return "Adarsh is skilled in <b>Python (90%)</b>, <b>Machine Learning (85%)</b>, <b>AI Techniques (80%)</b>, <b>Statistical Analysis (85%)</b>, and <b>Deep Learning (80%)</b>. His tech stack includes <b>Python</b>, <b>C++</b>, <b>TensorFlow</b>, <b>PyTorch</b>, <b>Streamlit</b>, <b>WebSockets</b>, <b>Docker</b>, <b>MongoDB & RDBMS</b>. He also has experience with <b>NLP</b>, <b>Matplotlib</b>, <b>Excel</b>, <b>Git</b>, <b>AWS</b>, <b>GCP</b>, and <b>Finetuning & SEO</b>.";
  } else if (q.includes('education') || q.includes('study')) {
    return "Adarsh is a third-year <b>B.Tech.</b> student majoring in <b>Engineering Physics</b> at the <b>Indian Institute of Technology Roorkee</b> (2022-2026). Before that, he completed his higher secondary education at <b>B.B.S International School</b> (2017-2021).";
  } else if (q.includes('contact') || q.includes('reach') || q.includes('email')) {
    return "You can contact Adarsh through email at <b>adarshukla3005@gmail.com</b>, phone at <b>+91 8707446780</b>, or through LinkedIn at <b>https://www.linkedin.com/in/adarsh-shukla30/</b>. He's based in <b>Uttarakhand, India</b>.";
  } else if (q.includes('intern') || q.includes('job')) {
    return "Adarsh has completed internships including: 1) <b>Summer Internship</b> at <b>IIT Roorkee</b> (May-July 2024) working on <b>Auto Segmentation of Images</b>, and 2) <b>Financial Analyst Intern</b> at <b>Awesome Advertising</b> (July-Aug 2024) where he developed a <b>financial report generator</b> using <b>RAG architecture</b>.";
  } else {
    return "I'm Adarsh's portfolio assistant. I can tell you about his skills in <b>AI/ML</b>, <b>projects</b>, education at <b>IIT Roorkee</b>, <b>work experience</b>, or <b>contact information</b>. What would you like to know?";
  }
}

// Create a fallback endpoint for testing when API keys are not set
app.post('/api/chatbot-mock', (req, res) => {
  const { query, sessionId } = req.body;
  
  // Simple mock responses based on keywords
  let response;
  if (query.toLowerCase().includes('project')) {
    response = "Adarsh has worked on several <b>AI</b> and <b>ML projects</b> including <b>neural networks</b>, <b>data analysis</b>, and <b>natural language processing</b> applications.";
  } else if (query.toLowerCase().includes('skill') || query.toLowerCase().includes('experience')) {
    response = "Adarsh is skilled in <b>Python</b>, <b>Machine Learning</b>, and <b>AI techniques</b> with a strong background in <b>data science</b>.";
  } else if (query.toLowerCase().includes('contact')) {
    response = "You can contact Adarsh through <b>LinkedIn</b> or the <b>contact form</b> on this website.";
  } else {
    response = "I'm a portfolio assistant for Adarsh Shukla. You can ask me about his <b>skills</b>, <b>projects</b>, or <b>experience</b>.";
  }
  
  // Return response with the provided sessionId or generate a new one
  res.json({ 
    response, 
    sessionId: sessionId || `mock_${Math.random().toString(36).substring(2, 15)}`
  });
});

// Create a .env file endpoint
app.get('/create-env-file', (req, res) => {
  const envContent = `PORT=3000
GEMINI_API_KEY=your_gemini_api_key`;

  fs.writeFileSync('.env', envContent);
  res.send('Environment file created successfully. Please update with your actual API keys.');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 