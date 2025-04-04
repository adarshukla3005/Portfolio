document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const chatbotToggle = document.getElementById('chatbot-toggle');
  const chatbotFloatingButton = document.getElementById('chatbot-floating-button');
  const chatbotContainer = document.getElementById('chatbot-container');
  const chatbotClose = document.getElementById('chatbot-close');
  const chatbotMessages = document.getElementById('chatbot-messages');
  const chatbotInput = document.getElementById('chatbot-input');
  const chatbotSubmit = document.getElementById('chatbot-submit');

  // API endpoint - using Netlify functions
  const API_ENDPOINT = '/.netlify/functions/chatbot';
  // Fallback endpoint in case the main one doesn't work
  const FALLBACK_ENDPOINT = '/.netlify/functions/chatbot';
  
  // Flag to track if we should use the fallback
  let useFallbackEndpoint = false;
  
  // Session ID for conversation tracking
  let sessionId = null;
  
  // Flag to track if chatbot is open
  let isChatbotOpen = false;

  // Open chatbot when the toggle is clicked (navigation menu)
  if (chatbotToggle) {
    chatbotToggle.addEventListener('click', function(e) {
      e.preventDefault();
      chatbotContainer.style.display = 'flex';
      isChatbotOpen = true;
    });
  }

  // Toggle chatbot when the floating button is clicked
  chatbotFloatingButton.addEventListener('click', function() {
    if (isChatbotOpen) {
      // Close the chatbot
      chatbotContainer.style.display = 'none';
      isChatbotOpen = false;
      
      // Clear the chat messages
      chatbotMessages.innerHTML = '';
      
      // Clear the session
      clearSession();
      
      // Change icon back to original from X
      chatbotFloatingButton.innerHTML = '<i class="fas fa-comment"></i>';
    } else {
      // Open the chatbot
      chatbotContainer.style.display = 'flex';
      isChatbotOpen = true;
      
      // Change icon to X
      chatbotFloatingButton.innerHTML = '<i class="fas fa-times"></i>';
    }
    
    // Generate a new session ID if none exists
    if (!sessionId) {
      sessionId = generateSessionId();
      console.log('New session started:', sessionId);
    }
    
    // Focus on input after opening
    setTimeout(() => {
      chatbotInput.focus();
    }, 300);
  });

  // Close chatbot when the close button is clicked
  chatbotClose.addEventListener('click', function() {
    // Hide the chatbot container
    chatbotContainer.style.display = 'none';
    // Show the floating button
    chatbotFloatingButton.style.display = 'flex';
    // Reset floating button icon
    chatbotFloatingButton.innerHTML = '<i class="fas fa-comment"></i>';
    
    // Update chatbot open state
    isChatbotOpen = false;
    
    // Option to clear chat history on close (uncomment to enable)
    // chatbotMessages.innerHTML = '';
    // clearSession();
  });

  // Send message when submit button is clicked
  chatbotSubmit.addEventListener('click', sendMessage);

  // Send message when Enter key is pressed
  chatbotInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // Generate a unique session ID
  function generateSessionId() {
    return 'session_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  // Function to send user message to the chatbot
  function sendMessage() {
    const message = chatbotInput.value.trim();
    if (message === '') return;

    // Add user message to chat
    addMessage(message, 'user');
    
    // Clear input
    chatbotInput.value = '';

    // Show loading indicator
    showLoadingIndicator();

    // Generate a new session ID if none exists
    if (!sessionId) {
      sessionId = generateSessionId();
      console.log('New session started:', sessionId);
    }

    // Send message to backend
    fetchResponse(message);
  }

  // Function to add a message to the chat
  function addMessage(message, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender === 'user' ? 'user-message' : 'bot-message');
    
    // Use innerHTML instead of textContent to render HTML bold tags correctly
    if (sender === 'bot') {
      messageElement.innerHTML = message;
    } else {
      messageElement.textContent = message;
    }
    
    chatbotMessages.appendChild(messageElement);
    
    // Scroll to bottom of messages
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  // Show loading indicator
  function showLoadingIndicator() {
    const loadingElement = document.createElement('div');
    loadingElement.classList.add('message', 'bot-message', 'loading-message');
    loadingElement.textContent = 'Thinking';
    loadingElement.id = 'loading-indicator';
    chatbotMessages.appendChild(loadingElement);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
  }

  // Remove loading indicator
  function removeLoadingIndicator() {
    const loadingElement = document.getElementById('loading-indicator');
    if (loadingElement) {
      loadingElement.remove();
    }
  }

  // Function to fetch response from the backend
  async function fetchResponse(message) {
    const endpoint = useFallbackEndpoint ? FALLBACK_ENDPOINT : API_ENDPOINT;
    console.log(`Using endpoint: ${endpoint} with sessionId: ${sessionId}`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: message,
          sessionId: sessionId 
        }),
      });

      // Remove loading indicator
      removeLoadingIndicator();

      if (!response.ok) {
        // If the main endpoint fails, use the fallback next time
        if (!useFallbackEndpoint) {
          console.log('Switching to fallback endpoint for next request');
          useFallbackEndpoint = true;
          throw new Error('Response not OK, switching to fallback');
        } else {
          throw new Error('Both endpoints failed');
        }
      }

      const data = await response.json();
      
      if (data.answer) {
        // Add the bot's response to the chat
        addMessage(data.answer, 'bot');
      } else {
        // If no answer was provided, show an error message
        addMessage("I'm having trouble connecting right now. Please try again later.", 'bot');
      }
    } catch (error) {
      console.error('Error fetching response:', error);
      
      // Remove loading indicator if it's still there
      removeLoadingIndicator();
      
      // Add error message to chat
      addMessage("I'm having trouble connecting right now. Please try again later.", 'bot');
    }
  }

  // Clear the current session (simplified for Netlify)
  async function clearSession() {
    if (!sessionId) return;
    
    console.log('Session cleared:', sessionId);
    sessionId = null;
  }

  // Add a clear chat button
  const clearChatButton = document.createElement('button');
  clearChatButton.textContent = 'Clear Chat';
  clearChatButton.classList.add('clear-chat-button');
  clearChatButton.style.position = 'absolute';
  clearChatButton.style.top = '17px';
  clearChatButton.style.right = '45px';
  clearChatButton.style.fontSize = '12px';
  clearChatButton.style.padding = '2px 5px';
  clearChatButton.style.background = '#f87171';
  clearChatButton.style.color = 'white';
  clearChatButton.style.border = 'none';
  clearChatButton.style.borderRadius = '3px';
  clearChatButton.style.cursor = 'pointer';
  
  clearChatButton.addEventListener('click', function() {
    // Clear the chat messages
    chatbotMessages.innerHTML = '';
    // Clear the session
    clearSession();
  });
  
  // Add the button to the chatbot header
  document.querySelector('.chatbot-header').appendChild(clearChatButton);

  // Add a small toggle button for fallback mode (in development only)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const toggleFallbackButton = document.createElement('button');
    toggleFallbackButton.textContent = 'Fallback Mode';
    toggleFallbackButton.style.position = 'absolute';
    toggleFallbackButton.style.top = '17px';
    toggleFallbackButton.style.right = '125px';
    toggleFallbackButton.style.fontSize = '12px';
    toggleFallbackButton.style.padding = '2px 5px';
    toggleFallbackButton.style.background = '#ccc';
    toggleFallbackButton.style.border = 'none';
    toggleFallbackButton.style.borderRadius = '3px';
    toggleFallbackButton.style.cursor = 'pointer';
    
    toggleFallbackButton.addEventListener('click', function() {
      useFallbackEndpoint = !useFallbackEndpoint;
      const modeText = useFallbackEndpoint ? 'Using fallback mode (predefined responses)' : 'Using Gemini AI responses';
      addMessage(modeText, 'bot');
    });
    
    // Add the button to the chatbot header
    document.querySelector('.chatbot-header').appendChild(toggleFallbackButton);
  }
  
  // Handle page unload/refresh - clear session
  window.addEventListener('beforeunload', function() {
    clearSession();
  });
}); 