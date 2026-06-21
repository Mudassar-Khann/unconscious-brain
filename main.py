import json
import os
import re
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Second Brain Idea Capture API")

IDEAS_FILE = "ideas.json"

# Models
class IdeaCreate(BaseModel):
    content: str

class IdeaResponse(BaseModel):
    id: str
    content: str
    tags: list[str]
    created_at: str

# Helper functions for data persistence
def load_ideas() -> list[dict]:
    if not os.path.exists(IDEAS_FILE):
        return []
    try:
        with open(IDEAS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_ideas(ideas: list[dict]):
    try:
        with open(IDEAS_FILE, "w", encoding="utf-8") as f:
            json.dump(ideas, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving ideas: {e}")

def extract_tags(text: str) -> list[str]:
    # Find hashtags (e.g. #creative, #todo) ignoring trailing punctuation.
    # Regex matches '#' followed by alphanumeric/underscore/dash.
    raw_tags = re.findall(r"#([a-zA-Z0-9_\-]+)", text)
    # Deduplicate and normalize to lowercase
    return list(dict.fromkeys([tag.lower() for tag in raw_tags]))

# API Routes
@app.get("/api/ideas", response_model=list[IdeaResponse])
def get_ideas():
    ideas = load_ideas()
    # Sort ideas chronologically, newest first
    ideas.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return ideas

@app.post("/api/ideas", response_model=IdeaResponse)
def create_idea(payload: IdeaCreate):
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Content cannot be empty.")
    
    ideas = load_ideas()
    tags = extract_tags(content)
    
    new_idea = {
        "id": str(uuid.uuid4()),
        "content": content,
        "tags": tags,
        "created_at": datetime.now().isoformat()
    }
    
    ideas.append(new_idea)
    save_ideas(ideas)
    return new_idea

@app.delete("/api/ideas/{idea_id}")
def delete_idea(idea_id: str):
    ideas = load_ideas()
    updated_ideas = [idea for idea in ideas if idea.get("id") != idea_id]
    
    if len(ideas) == len(updated_ideas):
        raise HTTPException(status_code=404, detail="Idea not found.")
    
    save_ideas(updated_ideas)
    return {"message": "Idea deleted successfully.", "id": idea_id}

@app.put("/api/ideas/{idea_id}", response_model=IdeaResponse)
def update_idea(idea_id: str, payload: IdeaCreate):
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Content cannot be empty.")
    
    ideas = load_ideas()
    for idea in ideas:
        if idea.get("id") == idea_id:
            idea["content"] = content
            idea["tags"] = extract_tags(content)
            save_ideas(ideas)
            return idea
            
    raise HTTPException(status_code=404, detail="Idea not found.")

# Serve the HTML frontend at root
@app.get("/", response_class=HTMLResponse)
def read_root():
    index_path = os.path.join("static", "index.html")
    if not os.path.exists(index_path):
        raise HTTPException(status_code=404, detail="Frontend index.html not found.")
    with open(index_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

# Mount the static directory to serve CSS and JS
# Ensure static directory exists
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
