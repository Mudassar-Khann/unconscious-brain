# Neural Link // Second Brain Idea Capture

An offline-first, terminal-inspired dashboard and FastAPI backend built to help you capture, index, and organize your thoughts, code snippets, and creative inspirations.

![Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Python](https://img.shields.io/badge/Python-3.9+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green)

---

## 🚀 Key Features

* **Instant Capture:** Keyboard shortcut support (`Ctrl + Enter`) for fast stream-of-consciousness typing.
* **Automatic Tag Indexing:** Write hashtags (e.g., `#ideas`, `#todo`) directly in the editor, and they will be indexed automatically on the dashboard.
* **Interactive Tags Index:** Filter the brain archives grid by simply clicking tag badges. 
* **Dynamic Ambience Customization:** Switch between multiple terminal interfaces including:
  * **Obsidian Dark** (Rich purple)
  * **Cyber Terminal** (Matrix green)
  * **Muted Forest** (Sage green)
  * **Vintage Sepia** (Warm typewriter paper)
* **Streak Tracking:** Computes capture streaks automatically to encourage daily logging.
* **Visual Connections:** Hovering over any card badge highlights all cards that share the same tag.
* **Inline Markdown Support:** Render lists, links, images, and code highlights instantly with marked.js integration.
* **Creative Prompt Generator:** Built-in writing prompt generator loaded with interactive prompts to spark brainstorming.

---

## 📂 Project Structure

```text
idea_capture_node/
├── main.py             # FastAPI App, routes, data models, and persistence logic
├── ideas.json          # Local database storage (JSON schema format)
├── requirements.txt    # Python library dependencies
└── static/             # Client-side assets
    ├── index.html      # DOM workspace structure and layout
    ├── style.css       # Ambience themes and grid stylesheets
    └── app.js          # REST integration, state engine, and event handlers
```

---

## 🛠️ Getting Started

### 1. Prerequisites
Ensure you have Python 3.9+ installed on your system.

### 2. Installation
Clone the repository, navigate into the directory, and install python dependencies:
```bash
pip install -r requirements.txt
```

### 3. Run the Application
Start the uvicorn development server:
```bash
python main.py
```
After launching, open your browser and navigate to:
👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 📡 API Endpoints

The server exposes a clean REST API:

| Method | Endpoint | Description | Payload / Response |
| :--- | :--- | :--- | :--- |
| **GET** | `/` | Serves index.html layout template | HTML Document |
| **GET** | `/api/ideas` | Retrieves all captured ideas sorted chronologically | `Array` of IdeaResponse |
| **POST** | `/api/ideas` | Saves a new idea, processes regex tags, and returns it | Request: `IdeaCreate`, Response: `IdeaResponse` |
| **DELETE**| `/api/ideas/{id}` | De-orbits / removes an idea from the database | Confirmation Message |

---

## 📝 License
This project is open-source and free to customize under the MIT License.
