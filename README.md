# Multi-Agent Peer Voting Engine - Ultra Edition

A full-stack application for multi-agent LLM-based peer review and consensus, featuring a FastAPI backend and a modern React + Vite frontend.

---

## Features

- **Multi-Agent LLM Peer Review:** Multiple AI agents analyze, critique, and score responses from different analytical perspectives.
- **Consensus Visualization:** Interactive D3 chord diagrams to visualize agent agreement and scoring.
- **Modern Frontend:** Built with React, Vite, TailwindCSS, D3, and Framer Motion for smooth UI and data visualization.
- **Flexible LLM Backend:** Supports Groq and Gemini LLMs, with robust error handling and retry logic.
- **API-First Design:** FastAPI backend with CORS enabled for easy integration.

---

## Project Structure

```
multi-agent-voter/
│
├── main.py                # FastAPI backend entrypoint
├── llm_client.py          # LLM API integration (Groq, Gemini)
├── prompts.py             # System prompts and agent instructions
├── requirements.txt       # Python dependencies
├── feedback.txt           # Feedback logs
├── api_feedback.txt       # API feedback logs
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React app with agent logic & D3 visualization
│   │   ├── main.jsx       # React entrypoint
│   │   ├── App.css, index.css
│   ├── index.html
│   ├── package.json       # Frontend dependencies & scripts
│   ├── vite.config.js
│   └── README.md
└── ...
```

---

## Backend Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   - `GROQ_API_KEY` (for Groq LLM)
   - `GEMINI_API_KEY` (for Gemini LLM)
   - Optionally use a `.env` file.

3. **Run the FastAPI server:**
   ```bash
   uvicorn main:app --reload
   ```

---

## Frontend Setup

1. **Install Node.js dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

---

## Agent Perspectives

- **A:** First-Principles – Deconstructs into fundamental truths.
- **B:** Devil's Advocate – Refutes common misconceptions.
- **C:** Step-by-Step – 3-5 discrete logical steps.
- **D:** Executive Summary – High density, bullet points.
- **E:** Lateral Thinker – Edge cases & boundary conditions.

---

## Technologies Used

- **Backend:** Python, FastAPI, Uvicorn, Groq, Gemini, Tenacity, python-dotenv
- **Frontend:** React, Vite, TailwindCSS, D3, Framer Motion, Lucide React

---

## License

This project is for educational and research purposes.
