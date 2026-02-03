let currentEditingProduct = null;

// Load recent orders
async function loadRecentOrders() {
  console.log('[loadRecentOrders] Starting to load orders...');
  const loadingEl = document.getElementById('orders-loading');
  const errorEl = document.getElementById('orders-error');
  const listEl = document.getElementById('orders-list');
  
  // Safety check
  if (!loadingEl || !listEl) {
    console.error('[loadRecentOrders] DOM elements not found:', { loadingEl: !!loadingEl, listEl: !!listEl });
    return;
  }
  
  console.log('[loadRecentOrders] DOM elements found, showing loading...');
  // Show loading, hide error
  if (loadingEl) loadingEl.style.display = 'block';
  if (errorEl) errorEl.style.display = 'none';
  
  try {
    console.log('[loadRecentOrders] Fetching orders from API...');
    const response = await fetch('/api/orders?limit=10&sortBy=createdAt&sortOrder=desc');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[loadRecentOrders] API Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[loadRecentOrders] API Response:', result);
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to load orders');
    }
    
    // Handle paginated response format
    let orders = [];
    if (result.data) {
      if (Array.isArray(result.data)) {
        orders = result.data;
        console.log('[loadRecentOrders] Found orders in result.data (direct array):', orders.length);
      } else if (result.data.data && Array.isArray(result.data.data)) {
        orders = result.data.data;
        console.log('[loadRecentOrders] Found orders in result.data.data (paginated):', orders.length);
      } else if (result.data.orders && Array.isArray(result.data.orders)) {
        orders = result.data.orders;
        console.log('[loadRecentOrders] Found orders in result.data.orders:', orders.length);
      } else {
        console.warn('[loadRecentOrders] Unexpected response structure:', result);
      }
    } else {
      console.warn('[loadRecentOrders] No data field in response:', result);
    }
    
    console.log('[loadRecentOrders] Orders loaded:', orders.length);
    
    if (orders.length === 0) {
      console.warn('[loadRecentOrders] No orders found in response:', result);
      if (listEl) listEl.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No orders found</p>';
      if (loadingEl) {
        loadingEl.style.display = 'none';
        console.log('[loadRecentOrders] Loading element hidden (no orders)');
      }
      if (errorEl) errorEl.style.display = 'none';
      return;
    }
    
    if (!listEl) {
      console.error('[loadRecentOrders] Orders list element not found');
      if (loadingEl) {
        loadingEl.style.display = 'none';
        console.log('[loadRecentOrders] Loading element hidden (no list element)');
      }
      return;
    }
    
    console.log('[loadRecentOrders] Rendering', orders.length, 'orders');
    try {
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
      
      console.log('[loadRecentOrders] Orders rendered successfully');
    } catch (renderError) {
      console.error('[loadRecentOrders] Error rendering orders:', renderError);
      throw renderError;
    }
    
    // Hide loading and error elements - IMPORTANT: Do this AFTER rendering
    if (loadingEl) {
      loadingEl.style.display = 'none';
      console.log('[loadRecentOrders] Loading element hidden');
    }
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  } catch (err) {
    console.error('[loadRecentOrders] Error loading orders:', err);
    if (loadingEl) {
      loadingEl.style.display = 'none';
      console.log('[loadRecentOrders] Loading element hidden (error)');
    }
    if (errorEl) {
      errorEl.textContent = 'Failed to load orders: ' + err.message;
      errorEl.style.display = 'block';
      console.log('[loadRecentOrders] Error element shown');
    }
  }
}

// Load products
async function loadProducts(searchTerm = '') {
  const loadingEl = document.getElementById('products-loading');
  const errorEl = document.getElementById('products-error');
  const listEl = document.getElementById('products-list');
  
  // Safety check
  if (!loadingEl || !listEl) {
    console.error('Products DOM elements not found');
    return;
  }
  
  // Show loading, hide error
  if (loadingEl) loadingEl.style.display = 'block';
  if (errorEl) errorEl.style.display = 'none';
  
  try {
    let url = '/api/products?limit=50&sortBy=name&sortOrder=asc';
    if (searchTerm) {
      url += `&search=${encodeURIComponent(searchTerm)}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Products API Response:', result);
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to load products');
    }
    
    // Handle paginated response format: { success: true, data: { data: [...], pagination: {...} } }
    let products = [];
    if (result.data) {
      if (Array.isArray(result.data)) {
        // Direct array response
        products = result.data;
        console.log('Found products in result.data (direct array):', products.length);
      } else if (result.data.data && Array.isArray(result.data.data)) {
        // Paginated response: { data: { data: [...], pagination: {...} } }
        products = result.data.data;
        console.log('Found products in result.data.data (paginated):', products.length);
      } else if (result.data.products && Array.isArray(result.data.products)) {
        // Alternative format
        products = result.data.products;
        console.log('Found products in result.data.products:', products.length);
      } else {
        console.warn('Unexpected response structure:', result);
      }
    } else {
      console.warn('No data field in response:', result);
    }
    
    console.log('Products loaded:', products.length);
    
    if (products.length === 0) {
      console.warn('No products found in response:', result);
      if (listEl) {
        listEl.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No products found</p>';
      }
      if (loadingEl) loadingEl.style.display = 'none';
      if (errorEl) errorEl.style.display = 'none';
      return;
    }
    
    if (!listEl) {
      console.error('Products list element not found');
      if (loadingEl) loadingEl.style.display = 'none';
      return;
    }
    
    console.log('Rendering', products.length, 'products');
    try {
      listEl.innerHTML = products.map(product => {
        // Safety check for variants
        const variants = product.variants || [];
        const defaultVariant = variants.find(v => v.isDefault) || variants[0];
        const price = defaultVariant ? (defaultVariant.price || 0) : 0;
        
        return `
          <div class="product-item">
            <div class="product-info">
              <div class="product-name">${escapeHtml(product.name || 'Unnamed Product')}</div>
              <div class="product-details">
                Status: ${escapeHtml(product.status || 'unknown')} | 
                Price: $${price.toFixed(2)} | 
                Variants: ${variants.length}
              </div>
            </div>
            <div class="product-actions">
              <button class="btn btn-edit" onclick="editProduct('${product.id}')">Edit</button>
            </div>
          </div>
        `;
      }).join('');
      
      console.log('Products rendered successfully');
    } catch (renderError) {
      console.error('Error rendering products:', renderError);
      throw renderError;
    }
    
    // Hide loading and error elements - IMPORTANT: Do this AFTER rendering
    if (loadingEl) {
      loadingEl.style.display = 'none';
      console.log('Loading element hidden');
    }
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  } catch (err) {
    console.error('Error loading products:', err);
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) {
      errorEl.textContent = 'Failed to load products: ' + err.message;
      errorEl.style.display = 'block';
    }
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
  console.log('Admin page loaded, initializing...');
  
  // Initialize LLM provider selection
  initLLMProviderSelection();
  
  // Load initial data
  console.log('Loading orders and products...');
  loadRecentOrders().catch(err => console.error('Failed to load orders:', err));
  loadProducts().catch(err => console.error('Failed to load products:', err));
  
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
  
  // Format text: preserve line breaks and basic formatting
  let formattedText = escapeHtml(text);
  // Convert \n\n to double line breaks
  formattedText = formattedText.replace(/\n\n/g, '<br><br>');
  // Convert single \n to line breaks
  formattedText = formattedText.replace(/\n/g, '<br>');
  // Convert **text** to <strong>text</strong>
  formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Convert numbered lists (1. text) to better formatting
  formattedText = formattedText.replace(/(\d+)\.\s/g, '<strong>$1.</strong> ');
  
  messageDiv.innerHTML = `
    <div class="message-avatar">${isUser ? '👤' : '💬'}</div>
    <div class="message-content">
      <div class="message-bubble">${formattedText}</div>
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
    
    // Check for errors in response (including API key errors)
    if (data.error || 
        (data.message && (
          data.message.includes('Error:') || 
          data.message.includes('❌') || 
          data.message.includes('🔑') ||
          data.message.includes('API Key') ||
          data.message.includes('API key') ||
          data.message.includes('GROQ_API_KEY') ||
          data.message.includes('GEMINI_API_KEY') ||
          data.message.includes('No LLM provider')
        ))) {
      console.error('[Chatbot] Error in agent response:', data);
      addMessage(data.message || 'Sorry, I encountered an error. Please try again.', false);
      return;
    }
    
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
    console.error('[Chatbot] Error calling agent:', error);
    removeLoadingMessage();
    
    // Show detailed error message
    let errorMessage = 'Sorry, I encountered an error. Please try again.';
    if (error.message) {
      errorMessage = error.message;
    }
    
    addMessage(errorMessage, false);
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
