# Quick Start Guide

## 🚀 Start the Service in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Seed Database (First Time Only)
```bash
npm run seed
```

### Step 3: Start Service
```bash
npm run dev
```

That's it! The service will start on **http://localhost:3000**

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] **Node.js 18+** installed
  ```bash
  node --version  # Should show v18 or higher
  ```

- [ ] **Ollama** installed and running
  ```bash
  ollama --version  # Should show version
  ollama list       # Should show available models
  ```

- [ ] **Ollama model** downloaded (choose one):
  
  **Option 1: Full Model (Recommended for Production)**
  ```bash
  ollama pull qwen3-coder:30b
  ```
  ⚠️ **Note:** This is a ~19GB model. Download may take time.
  
  **Option 2: Smaller/Faster Model (For Testing)**
  ```bash
  ollama pull qwen2.5-coder:7b
  ```
  ✅ **Note:** This is a smaller model (~4GB) for faster testing.
  
  **Test Ollama is working:**
  ```bash
  # Test with full model
  ollama run qwen3-coder:30b
  
  # OR test with smaller model
  ollama run qwen2.5-coder:7b
  ```
  
  **Test Ollama API:**
  ```bash
  curl http://localhost:11434/api/generate \
    -d '{
      "model": "qwen3-coder:30b",
      "prompt": "Write hello world in TypeScript"
    }'
  ```

---

## 🎯 Access Points

Once the service is running:

| Service | URL | Description |
|---------|-----|-------------|
| **Storefront** | http://localhost:3000/ | Customer-facing store |
| **Admin Dashboard** | http://localhost:3000/admin | Admin panel with StorePilot chatbot |
| **API Docs** | http://localhost:3000/api | Backend API documentation |
| **Health Check** | http://localhost:3000/health | Service health status |

---

## 💬 Test the Chatbot

1. Open **http://localhost:3000/admin**
2. Click the **💬 StorePilot** button (bottom right corner)
3. Try these commands:
   - `"Change price of HP-BLK-001 to $320"`
   - `"Cancel order ORD-1001"`
   - `"What happened in this session?"`

---

## 🔧 Troubleshooting

### Port 3000 Already in Use
```bash
PORT=3001 npm run dev
```

### Ollama Not Running
```bash
# Start Ollama service
ollama serve

# In another terminal, verify
ollama list
```

### Missing Model
```bash
# Download the model (choose one)
ollama pull qwen3-coder:30b      # Full model (~19GB)
# OR
ollama pull qwen2.5-coder:7b     # Smaller model (~4GB) for testing

# Verify it's installed
ollama list | grep qwen

# Test the model
ollama run qwen3-coder:30b
# OR
ollama run qwen2.5-coder:7b
```

### Ollama API Not Responding
```bash
# Test Ollama API directly
curl http://localhost:11434/api/generate \
  -d '{
    "model": "qwen3-coder:30b",
    "prompt": "Hello"
  }'

# If it fails, make sure Ollama is running
ollama serve
```

### Module Not Found Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Development Commands

```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build
npm start

# Run tests
npm test

# Seed database
npm run seed
```

---

## 🏗️ Service Architecture

```
┌─────────────────────────────────────────┐
│         Ollama (Port 11434)             │
│         qwen3-coder:30b model            │
└─────────────────────────────────────────┘
                    ↑
                    │
┌─────────────────────────────────────────┐
│    Agent Service (Port 3000)            │
│    - SequentialAgent (Controller)       │
│    - PlannerAgent (LLM)                 │
│    - ValidationAgent                    │
│    - ExecutionAgent                     │
│    - ExplanationAgent (LLM)             │
└─────────────────────────────────────────┘
                    ↑
                    │
┌─────────────────────────────────────────┐
│    Backend API (Port 3000)              │
│    - /api/products                      │
│    - /api/orders                        │
│    - /api/promotions                    │
│    - /agent/chat                        │
└─────────────────────────────────────────┘
                    ↑
                    │
┌─────────────────────────────────────────┐
│    UI (Port 3000)                       │
│    - Storefront (/)                     │
│    - Admin Dashboard (/admin)           │
│    - StorePilot Chatbot                 │
└─────────────────────────────────────────┘
```

---

## ✅ Verification

After starting, verify everything works:

1. **Health Check**
   ```bash
   curl http://localhost:3000/health
   ```

2. **API Check**
   ```bash
   curl http://localhost:3000/api
   ```

3. **Test Chatbot**
   - Open http://localhost:3000/admin
   - Click StorePilot
   - Send a test message

---

## 🎉 You're Ready!

The service is now running and ready to process natural language commands through the StorePilot chatbot!

