let currentEditingProduct = null;

// Load recent orders
async function loadRecentOrders() {
  const loadingEl = document.getElementById('orders-loading');
  const errorEl = document.getElementById('orders-error');
  const listEl = document.getElementById('orders-list');
  
  try {
    const response = await fetch('/api/orders?limit=10&sortBy=createdAt&sortOrder=desc');
    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to load orders');
    }
    
    const orders = result.data.data || result.data || [];
    
    if (orders.length === 0) {
      listEl.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No orders found</p>';
      loadingEl.style.display = 'none';
      return;
    }
    
    listEl.innerHTML = orders.map(order => {
      const statusClass = order.status.replace(/_/g, '-');
      const date = new Date(order.createdAt).toLocaleDateString();
      const time = new Date(order.createdAt).toLocaleTimeString();
      
      const validStatuses = [
        'pending', 'confirmed', 'processing', 'on_hold', 'shipped', 
        'partially_shipped', 'delivered', 'completed', 'cancelled', 
        'refunded', 'partially_refunded'
      ];
      
      const statusOptions = validStatuses.map(status => 
        `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status}</option>`
      ).join('');
      
      return `
        <div class="order-card">
          <div class="order-header">
            <span class="order-number">${escapeHtml(order.orderNumber)}</span>
            <select class="order-status ${statusClass}" data-order-id="${order.id}" onchange="updateOrderStatus('${order.id}', this.value)">
              ${statusOptions}
            </select>
          </div>
          <div class="order-info">
            <div>
              <strong>Customer:</strong> ${escapeHtml(order.customerEmail)}<br>
              <strong>Date:</strong> ${date} ${time}
            </div>
            <div>
              <strong>Items:</strong> ${order.lineItems.length} item(s)<br>
              <strong>Total:</strong> <span class="order-total">$${order.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    loadingEl.style.display = 'none';
  } catch (err) {
    console.error('Error loading orders:', err);
    loadingEl.style.display = 'none';
    errorEl.textContent = 'Failed to load orders: ' + err.message;
    errorEl.style.display = 'block';
  }
}

// Load products
async function loadProducts(searchTerm = '') {
  const loadingEl = document.getElementById('products-loading');
  const errorEl = document.getElementById('products-error');
  const listEl = document.getElementById('products-list');
  
  try {
    let url = '/api/products?limit=50&sortBy=name&sortOrder=asc';
    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to load products');
    }
    
    const products = result.data.data || result.data || [];
    
    if (products.length === 0) {
      listEl.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No products found</p>';
      loadingEl.style.display = 'none';
      return;
    }
    
    listEl.innerHTML = products.map(product => {
      const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
      const price = defaultVariant ? defaultVariant.price : 0;
      
      return `
        <div class="product-item">
          <div class="product-info">
            <div class="product-name">${escapeHtml(product.name)}</div>
            <div class="product-details">
              Status: ${escapeHtml(product.status)} | 
              Price: $${price.toFixed(2)} | 
              Variants: ${product.variants.length}
            </div>
          </div>
          <div class="product-actions">
            <button class="btn btn-edit" onclick="editProduct('${product.id}')">Edit</button>
          </div>
        </div>
      `;
    }).join('');
    
    loadingEl.style.display = 'none';
  } catch (err) {
    console.error('Error loading products:', err);
    loadingEl.style.display = 'none';
    errorEl.textContent = 'Failed to load products: ' + err.message;
    errorEl.style.display = 'block';
  }
}

// Edit product
async function editProduct(productId) {
  try {
    const response = await fetch(`/api/products/${productId}`);
    const result = await response.json();
    
    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to load product');
    }
    
    const product = result.data;
    currentEditingProduct = product;
    
    // Populate form
    document.getElementById('edit-name').value = product.name || '';
    document.getElementById('edit-description').value = product.description || '';
    document.getElementById('edit-short-description').value = product.shortDescription || '';
    document.getElementById('edit-status').value = product.status || 'draft';
    document.getElementById('edit-vendor').value = product.vendor || '';
    document.getElementById('edit-brand').value = product.brand || '';
    document.getElementById('edit-tags').value = product.tags ? product.tags.join(', ') : '';
    
    const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
    if (defaultVariant) {
      document.getElementById('edit-price').value = defaultVariant.price || 0;
    }
    
    // Show modal
    document.getElementById('edit-modal').style.display = 'flex';
  } catch (err) {
    console.error('Error loading product:', err);
    alert('Failed to load product: ' + err.message);
  }
}

// Save product changes
async function saveProduct(event) {
  event.preventDefault();
  
  if (!currentEditingProduct) return;
  
  const formData = {
    name: document.getElementById('edit-name').value,
    description: document.getElementById('edit-description').value,
    shortDescription: document.getElementById('edit-short-description').value,
    status: document.getElementById('edit-status').value,
    vendor: document.getElementById('edit-vendor').value,
    brand: document.getElementById('edit-brand').value,
    tags: document.getElementById('edit-tags').value.split(',').map(t => t.trim()).filter(t => t),
  };
  
  try {
    // Update product info
    const response = await fetch(`/api/products/${currentEditingProduct.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update product');
    }
    
    // Update default variant price if provided
    const price = parseFloat(document.getElementById('edit-price').value);
    if (!isNaN(price) && currentEditingProduct.variants.length > 0) {
      const defaultVariant = currentEditingProduct.variants.find(v => v.isDefault) || currentEditingProduct.variants[0];
      if (defaultVariant && defaultVariant.price !== price) {
        // Update the variant price
        const variantResponse = await fetch(`/api/products/${currentEditingProduct.id}/variants/${defaultVariant.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ price: price }),
        });
        
        const variantResult = await variantResponse.json();
        
        if (!variantResult.success) {
          throw new Error(variantResult.error?.message || 'Failed to update variant price');
        }
      }
    }
    
    // Close modal and refresh products
    document.getElementById('edit-modal').style.display = 'none';
    loadProducts(document.getElementById('product-search').value);
    alert('Product updated successfully!');
  } catch (err) {
    console.error('Error updating product:', err);
    alert('Failed to update product: ' + err.message);
  }
}

// Close modal
function closeModal() {
  document.getElementById('edit-modal').style.display = 'none';
  currentEditingProduct = null;
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initialize LLM provider selection
  initLLMProviderSelection();
  
  // Load initial data
  loadRecentOrders();
  loadProducts();
  
  // Search products
  document.getElementById('product-search').addEventListener('input', (e) => {
    loadProducts(e.target.value);
  });
  
  // Refresh products
  document.getElementById('refresh-products').addEventListener('click', () => {
    loadProducts(document.getElementById('product-search').value);
  });
  
  // Modal handlers
  document.getElementById('close-modal').addEventListener('click', closeModal);
  document.getElementById('cancel-edit').addEventListener('click', closeModal);
  document.getElementById('edit-product-form').addEventListener('submit', saveProduct);
  
  // Close modal on outside click
  document.getElementById('edit-modal').addEventListener('click', (e) => {
    if (e.target.id === 'edit-modal') {
      closeModal();
    }
  });
});

// Update order status
async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to update order status');
    }
    
    // Reload orders to show updated status
    loadRecentOrders();
  } catch (err) {
    console.error('Error updating order status:', err);
    alert('Failed to update order status: ' + err.message);
    // Reload to revert the UI change
    loadRecentOrders();
  }
}

// Make functions available globally
window.editProduct = editProduct;
window.updateOrderStatus = updateOrderStatus;
window.getCurrentLLMProvider = getCurrentLLMProvider;

// ==================== LLM Provider Selection ====================

let currentLLMProvider = 'local'; // Default to local LLM

// Initialize LLM provider selection
function initLLMProviderSelection() {
  // Load saved preference from localStorage
  const savedProvider = localStorage.getItem('llmProvider') || 'local';
  setLLMProvider(savedProvider);
  
  // Add event listeners to toggle buttons
  const localBtn = document.getElementById('llm-local');
  const premiumBtn = document.getElementById('llm-premium');
  
  if (localBtn) {
    localBtn.addEventListener('click', () => {
      setLLMProvider('local');
    });
  }
  
  if (premiumBtn) {
    premiumBtn.addEventListener('click', () => {
      setLLMProvider('premium');
    });
  }
}

// Set LLM provider (only one can be active at a time)
function setLLMProvider(provider) {
  if (provider !== 'local' && provider !== 'premium') {
    console.error('Invalid LLM provider:', provider);
    return;
  }
  
  currentLLMProvider = provider;
  
  // Update UI - ensure only one is active
  const localBtn = document.getElementById('llm-local');
  const premiumBtn = document.getElementById('llm-premium');
  
  if (provider === 'local') {
    // Enable local, disable premium
    localBtn.classList.add('active');
    localBtn.disabled = false;
    premiumBtn.classList.remove('active');
    premiumBtn.disabled = false; // Keep enabled so user can click to switch
  } else {
    // Enable premium, disable local
    premiumBtn.classList.add('active');
    premiumBtn.disabled = false;
    localBtn.classList.remove('active');
    localBtn.disabled = false; // Keep enabled so user can click to switch
  }
  
  // Save preference to localStorage
  localStorage.setItem('llmProvider', provider);
  
  // Log the change (can be replaced with API call later)
  console.log('LLM Provider changed to:', provider);
  
  // TODO: Send preference to backend/agent service
  // This can be implemented when backend is ready
  // Example: fetch('/api/llm-provider', { method: 'POST', body: JSON.stringify({ provider }) });
}

// Get current LLM provider
function getCurrentLLMProvider() {
  return currentLLMProvider;
}

// ==================== Chatbot UI Functionality ====================

let chatbotOpen = false;

// Toggle chatbot panel
function toggleChatbot() {
  chatbotOpen = !chatbotOpen;
  const panel = document.getElementById('chatbot-panel');
  const overlay = document.getElementById('chatbot-overlay');
  const toggle = document.getElementById('chatbot-toggle');
  
  if (chatbotOpen) {
    panel.classList.add('active');
    overlay.classList.add('active');
    toggle.style.display = 'none';
    // Focus input when opening
    setTimeout(() => {
      document.getElementById('chatbot-input').focus();
    }, 300);
  } else {
    panel.classList.remove('active');
    overlay.classList.remove('active');
    toggle.style.display = 'flex';
  }
}

// Close chatbot
function closeChatbot() {
  chatbotOpen = false;
  const panel = document.getElementById('chatbot-panel');
  const overlay = document.getElementById('chatbot-overlay');
  const toggle = document.getElementById('chatbot-toggle');
  
  panel.classList.remove('active');
  overlay.classList.remove('active');
  toggle.style.display = 'flex';
}

// Add message to chat
function addMessage(text, isUser = false) {
  const messagesContainer = document.getElementById('chatbot-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
  
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  messageDiv.innerHTML = `
    <div class="message-avatar">${isUser ? '👤' : '💬'}</div>
    <div class="message-content">
      <div class="message-bubble">${escapeHtml(text)}</div>
      <div class="message-time">${time}</div>
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  scrollToBottom();
}

// Add loading message
function addLoadingMessage() {
  const messagesContainer = document.getElementById('chatbot-messages');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message assistant';
  messageDiv.id = 'loading-message';
  
  messageDiv.innerHTML = `
    <div class="message-avatar">💬</div>
    <div class="message-content">
      <div class="message-bubble message-loading">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  scrollToBottom();
}

// Remove loading message
function removeLoadingMessage() {
  const loadingMessage = document.getElementById('loading-message');
  if (loadingMessage) {
    loadingMessage.remove();
  }
}

// Scroll to bottom of messages
function scrollToBottom() {
  const messagesContainer = document.getElementById('chatbot-messages');
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Get or create session ID
function getSessionId() {
  let sessionId = sessionStorage.getItem('admin-session-id');
  if (!sessionId) {
    sessionId = 'admin-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('admin-session-id', sessionId);
  }
  return sessionId;
}

// Store pending confirmation state
let pendingConfirmation = null;

// Handle chatbot form submission
async function handleChatbotSubmit(event) {
  event.preventDefault();
  
  const input = document.getElementById('chatbot-input');
  const message = input.value.trim();
  
  // Basic validation
  if (!message) {
    addMessage('Please enter your question or message.', false);
    return;
  }
  
  if (message.length < 2) {
    addMessage('Please enter at least 2 characters.', false);
    return;
  }
  
  // Check if this is a confirmation
  if (pendingConfirmation && message.toUpperCase().includes('CONFIRM')) {
    await handleConfirmation(true);
    input.value = '';
    return;
  }
  
  // Clear input
  input.value = '';
  
  // Add user message
  addMessage(message, true);
  
  // Add loading indicator
  addLoadingMessage();
  
  // Disable input while processing
  const sendButton = document.querySelector('.chatbot-send');
  const inputField = document.getElementById('chatbot-input');
  sendButton.disabled = true;
  inputField.disabled = true;
  
  try {
    // Call agent API
    const sessionId = getSessionId();
    const response = await fetch('/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        sessionId: sessionId
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Remove loading message
    removeLoadingMessage();
    
    // Handle confirmation request
    if (data.requiresConfirmation && data.workflowId) {
      pendingConfirmation = {
        workflowId: data.workflowId,
        sessionId: sessionId
      };
      addMessage(data.message, false);
      
      // Add confirmation button
      addConfirmationButtons(data.workflowId, sessionId);
    } else {
      // Regular response
      addMessage(data.message || 'I apologize, but I couldn\'t process your request.', false);
      
      // Refresh data if operation was successful
      if (data.message && data.message.includes('✅')) {
        // Refresh orders and products to show updated data
        setTimeout(() => {
          loadRecentOrders();
          loadProducts();
        }, 500);
      }
    }
  } catch (error) {
    console.error('Error calling agent:', error);
    removeLoadingMessage();
    addMessage('Sorry, I encountered an error. Please try again.', false);
  } finally {
    sendButton.disabled = false;
    inputField.disabled = false;
    inputField.focus();
  }
}

// Handle confirmation
async function handleConfirmation(confirmed) {
  if (!pendingConfirmation) return;
  
  const { workflowId, sessionId } = pendingConfirmation;
  
  // Add loading indicator
  addLoadingMessage();
  
  try {
    const response = await fetch('/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflowId: workflowId,
        sessionId: sessionId,
        confirmed: confirmed
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Remove loading message
    removeLoadingMessage();
    
    // Clear pending confirmation
    pendingConfirmation = null;
    
    // Remove confirmation buttons
    removeConfirmationButtons();
    
    // Show result
    addMessage(data.message || (confirmed ? 'Action confirmed and executed.' : 'Action cancelled.'), false);
    
    // Refresh data if confirmed and successful
    if (confirmed && data.message && data.message.includes('✅')) {
      setTimeout(() => {
        loadRecentOrders();
        loadProducts();
      }, 500);
    }
  } catch (error) {
    console.error('Error handling confirmation:', error);
    removeLoadingMessage();
    addMessage('Sorry, I encountered an error processing your confirmation.', false);
  }
}

// Add confirmation buttons
function addConfirmationButtons(workflowId, sessionId) {
  const messagesContainer = document.getElementById('chatbot-messages');
  const buttonDiv = document.createElement('div');
  buttonDiv.className = 'message assistant';
  buttonDiv.id = 'confirmation-buttons';
  
  buttonDiv.innerHTML = `
    <div class="message-avatar">💬</div>
    <div class="message-content">
      <div class="message-bubble confirmation-buttons">
        <button class="confirm-btn" onclick="handleConfirmation(true)">✅ Confirm</button>
        <button class="cancel-btn" onclick="handleConfirmation(false)">❌ Cancel</button>
      </div>
    </div>
  `;
  
  messagesContainer.appendChild(buttonDiv);
  scrollToBottom();
}

// Remove confirmation buttons
function removeConfirmationButtons() {
  const buttons = document.getElementById('confirmation-buttons');
  if (buttons) {
    buttons.remove();
      }
    }
  } catch (error) {
    console.error('Error calling agent:', error);
    removeLoadingMessage();
    addMessage('Sorry, I encountered an error. Please try again.', false);
  } finally {
    sendButton.disabled = false;
    inputField.disabled = false;
    inputField.focus();
  }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Chatbot toggle button
  const toggleButton = document.getElementById('chatbot-toggle');
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleChatbot);
  }
  
  // Chatbot close button
  const closeButton = document.getElementById('chatbot-close');
  if (closeButton) {
    closeButton.addEventListener('click', closeChatbot);
  }
  
  // Chatbot overlay click to close
  const overlay = document.getElementById('chatbot-overlay');
  if (overlay) {
    overlay.addEventListener('click', closeChatbot);
  }
  
  // Chatbot form submission
  const chatbotForm = document.getElementById('chatbot-form');
  if (chatbotForm) {
    chatbotForm.addEventListener('submit', handleChatbotSubmit);
  }
  
  // Allow Enter key to send (but allow Shift+Enter for new line)
  const chatbotInput = document.getElementById('chatbot-input');
  if (chatbotInput) {
    chatbotInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatbotForm.dispatchEvent(new Event('submit'));
      }
    });
  }
});
