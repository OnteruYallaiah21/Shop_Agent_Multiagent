/**
 * StorePilot Chatbot for Storefront
 * 
 * Developer: Yallaiah onter
 * Email: yallaiah.ai.enginner@gmail.com
 * 
 * Handles chatbot interactions with basic validations and product suggestions
 */

// Product data cache
let productsData = [];

// Initialize chatbot
document.addEventListener('DOMContentLoaded', () => {
  initializeChatbot();
  loadProductsData();
});

// Load products from seed data
async function loadProductsData() {
  try {
    const response = await fetch('/api/products');
    if (response.ok) {
      const data = await response.json();
      productsData = data.data || [];
    }
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Initialize chatbot UI
function initializeChatbot() {
  const toggle = document.getElementById('chatbot-toggle');
  const panel = document.getElementById('chatbot-panel');
  const close = document.getElementById('chatbot-close');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');

  // Toggle chatbot panel
  toggle?.addEventListener('click', () => {
    panel?.classList.toggle('open');
  });

  close?.addEventListener('click', () => {
    panel?.classList.remove('open');
  });

  // Handle form submission
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleChatbotSubmit();
  });

  // Show product suggestions on input
  input?.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    if (value.length > 0) {
      showProductSuggestions(value);
    } else {
      hideProductSuggestions();
    }
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.chatbot-input-container')) {
      hideProductSuggestions();
    }
  });
}

// Basic validation
function validateInput(input) {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return {
      valid: false,
      error: 'Please enter your question or message.'
    };
  }

  if (trimmed.length < 2) {
    return {
      valid: false,
      error: 'Please enter at least 2 characters.'
    };
  }

  return { valid: true };
}

// Show product suggestions
function showProductSuggestions(query) {
  const suggestionsContainer = document.getElementById('product-suggestions');
  if (!suggestionsContainer || productsData.length === 0) return;

  const queryLower = query.toLowerCase();
  const matches = productsData
    .filter(product => {
      const name = (product.name || '').toLowerCase();
      const sku = product.variants?.find(v => v.sku)?.sku?.toLowerCase() || '';
      const description = (product.description || '').toLowerCase();
      return name.includes(queryLower) || sku.includes(queryLower) || description.includes(queryLower);
    })
    .slice(0, 5);

  if (matches.length === 0) {
    hideProductSuggestions();
    return;
  }

  suggestionsContainer.innerHTML = matches.map(product => {
    const defaultVariant = product.variants?.find(v => v.isDefault) || product.variants?.[0];
    const price = defaultVariant?.price || 'N/A';
    const sku = defaultVariant?.sku || 'N/A';
    
    return `
      <div class="suggestion-item" onclick="selectSuggestion('${product.name}', '${sku}')">
        <div class="suggestion-name">${product.name}</div>
        <div class="suggestion-details">SKU: ${sku} | Price: $${price}</div>
      </div>
    `;
  }).join('');

  suggestionsContainer.classList.add('show');
}

// Hide product suggestions
function hideProductSuggestions() {
  const suggestionsContainer = document.getElementById('product-suggestions');
  if (suggestionsContainer) {
    suggestionsContainer.classList.remove('show');
  }
}

// Select suggestion
function selectSuggestion(productName, sku) {
  const input = document.getElementById('chatbot-input');
  if (input) {
    input.value = `Tell me about ${productName} (${sku})`;
    input.focus();
    hideProductSuggestions();
    handleChatbotSubmit();
  }
}

// Handle chatbot form submission
async function handleChatbotSubmit() {
  const input = document.getElementById('chatbot-input');
  const messagesContainer = document.getElementById('chatbot-messages');
  const sendButton = document.getElementById('chatbot-send');
  
  if (!input || !messagesContainer) return;

  const userMessage = input.value.trim();

  // Basic validation
  const validation = validateInput(userMessage);
  if (!validation.valid) {
    showValidationError(validation.error);
    return;
  }

  // Clear validation errors
  clearValidationError();

  // Hide suggestions
  hideProductSuggestions();

  // Add user message
  addMessage(userMessage, 'user');
  input.value = '';
  sendButton.disabled = true;

  // Show loading
  const loadingId = addMessage('Thinking...', 'bot', true);

  try {
    // Call agent API - connects to SequentialAgent -> PlannerAgent
    const sessionId = getSessionId();
    const response = await fetch('/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        sessionId: sessionId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Remove loading message
    removeMessage(loadingId);
    
    // Add bot response from ExplanationAgent
    addMessage(data.message || 'I apologize, but I couldn\'t process your request.', 'bot');
    
    // If data was changed, the backend already updated it
    // The next API call will reflect the changes
  } catch (error) {
    console.error('Error calling agent:', error);
    removeMessage(loadingId);
    addMessage('Sorry, I encountered an error. Please try again.', 'bot', false, true);
  } finally {
    sendButton.disabled = false;
    input.focus();
  }
}

// Add message to chat
function addMessage(text, type, isLoading = false, isError = false) {
  const messagesContainer = document.getElementById('chatbot-messages');
  if (!messagesContainer) return null;

  const messageId = 'msg-' + Date.now();
  const messageDiv = document.createElement('div');
  messageDiv.id = messageId;
  messageDiv.className = `chatbot-message ${type}${isLoading ? ' loading' : ''}${isError ? ' error' : ''}`;
  
  messageDiv.innerHTML = `
    <div class="chatbot-message-content">${escapeHtml(text)}</div>
  `;

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  return messageId;
}

// Remove message
function removeMessage(messageId) {
  const message = document.getElementById(messageId);
  if (message) {
    message.remove();
  }
}

// Show validation error
function showValidationError(error) {
  clearValidationError();
  
  const inputContainer = document.querySelector('.chatbot-input-container');
  if (!inputContainer) return;

  const errorDiv = document.createElement('div');
  errorDiv.className = 'validation-error';
  errorDiv.id = 'validation-error';
  errorDiv.textContent = error;
  
  inputContainer.appendChild(errorDiv);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    clearValidationError();
  }, 5000);
}

// Clear validation error
function clearValidationError() {
  const error = document.getElementById('validation-error');
  if (error) {
    error.remove();
  }
}

// Get or create session ID
function getSessionId() {
  let sessionId = sessionStorage.getItem('storefront-session-id');
  if (!sessionId) {
    sessionId = 'storefront-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('storefront-session-id', sessionId);
  }
  return sessionId;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

