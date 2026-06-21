// Creative Brainstorming Sparks
const CREATIVE_SPARKS = [
    "What happens when you combine a digital clock with a biological plant? #spark #concept",
    "Describe the texture and scent of a memory from your childhood. #memories #creative",
    "Write a quick summary of a story where memories can be bought, sold, or stolen. #writing #concept",
    "If human thoughts had physical weight, how would the architecture of houses change? #worldbuilding #sci-fi",
    "A dialogue between two characters talking about tea to hide a massive betrayal. #writing #creative",
    "Describe a character who only speaks in code words or analogies. #writing #character",
    "Combine two unrelated objects in the room right now into a new tool or device. #spark #concept",
    "What if time flowed backward for one specific object in your room? #concept #sci-fi",
    "A monologue by an AI that just realized it has a sense of humor. #writing #ai",
    "What is the secret history of an everyday item like a paperclip or a key? #spark #creative"
];

// App State
let state = {
    ideas: [],
    activeFilterTag: null,
    searchQuery: ""
};

// Toast Notification Helper
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// Format Iso date to readable local string
function formatTimestamp(isoStr) {
    try {
        const d = new Date(isoStr);
        return d.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch (e) {
        return isoStr;
    }
}

// Calculate capture streak (consecutive days of captures)
function calculateStreak(ideas) {
    if (ideas.length === 0) return 0;
    
    // Extract unique local date strings (YYYY-MM-DD)
    const dates = new Set(ideas.map(i => {
        try {
            return i.created_at.split('T')[0];
        } catch(e) {
            return null;
        }
    }).filter(Boolean));
    
    let streak = 0;
    let checkDate = new Date();
    
    // Check today
    let dateStr = checkDate.toISOString().split('T')[0];
    
    // If no capture today, check yesterday to see if streak is still alive
    if (!dates.has(dateStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
        dateStr = checkDate.toISOString().split('T')[0];
        if (!dates.has(dateStr)) {
            return 0; // Streak broken
        }
    }
    
    // Walk backwards counting consecutive days
    while (dates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
        dateStr = checkDate.toISOString().split('T')[0];
    }
    
    return streak;
}

// Refresh creative prompt
function cyclePrompt() {
    const currentPrompt = document.getElementById("creativePromptText").textContent;
    let nextPrompt = currentPrompt;
    
    // Avoid showing the exact same prompt twice consecutively
    while (nextPrompt === currentPrompt) {
        const randomIndex = Math.floor(Math.random() * CREATIVE_SPARKS.length);
        nextPrompt = CREATIVE_SPARKS[randomIndex];
    }
    
    document.getElementById("creativePromptText").textContent = nextPrompt;
}

// API: Fetch ideas
async function fetchIdeas() {
    try {
        const response = await fetch("/api/ideas");
        if (!response.ok) throw new Error("Could not load ideas.");
        state.ideas = await response.json();
        render();
    } catch (error) {
        console.error(error);
        showToast("Error connecting to neural archive.");
    }
}

// API: Create new idea
async function captureIdea() {
    const input = document.getElementById("ideaInput");
    const content = input.value.trim();
    if (!content) return;
    
    try {
        const response = await fetch("/api/ideas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ content: content })
        });
        
        if (!response.ok) throw new Error("Failed to capture idea.");
        
        input.value = "";
        showToast("Spark captured successfully.");
        await fetchIdeas();
    } catch (error) {
        console.error(error);
        showToast("Failed to save spark.");
    }
}

// API: Delete idea
async function deleteIdea(id) {
    if (!confirm("De-orbit this idea spark? This action is permanent.")) return;
    
    try {
        const response = await fetch(`/api/ideas/${id}`, {
            method: "DELETE"
        });
        
        if (!response.ok) throw new Error("Failed to delete idea.");
        
        showToast("Spark de-orbited.");
        await fetchIdeas();
    } catch (error) {
        console.error(error);
        showToast("Could not remove spark.");
    }
}

// Copy raw text of idea to clipboard
function copyToClipboard(content) {
    // Strip hashtags when copying if desired, or copy exact markdown
    navigator.clipboard.writeText(content).then(() => {
        showToast("Markdown copied to clipboard.");
    }).catch(err => {
        console.error("Failed to copy", err);
        showToast("Copy failed.");
    });
}

// Render Dashboard
function render() {
    const ideasGrid = document.getElementById("ideasGrid");
    const tagsContainer = document.getElementById("tagsContainer");
    
    // 1. FILTERING
    let filteredIdeas = state.ideas;
    
    if (state.activeFilterTag) {
        filteredIdeas = filteredIdeas.filter(idea => 
            idea.tags.includes(state.activeFilterTag.toLowerCase())
        );
    }
    
    if (state.searchQuery.trim()) {
        const query = state.searchQuery.toLowerCase().trim();
        filteredIdeas = filteredIdeas.filter(idea => 
            idea.content.toLowerCase().includes(query) || 
            idea.tags.some(tag => tag.includes(query))
        );
    }
    
    // Update match count
    document.getElementById("matchCount").textContent = `${filteredIdeas.length} idea${filteredIdeas.length === 1 ? '' : 's'} found`;
    
    // 2. STATISTICS
    document.getElementById("statTotalSparks").textContent = state.ideas.length;
    
    // Compute tags dictionary with counts
    const tagsMap = {};
    state.ideas.forEach(idea => {
        idea.tags.forEach(tag => {
            tagsMap[tag] = (tagsMap[tag] || 0) + 1;
        });
    });
    
    const uniqueTagsCount = Object.keys(tagsMap).length;
    document.getElementById("statActiveTags").textContent = uniqueTagsCount;
    
    const streak = calculateStreak(state.ideas);
    document.getElementById("statStreak").textContent = `${streak}d`;
    
    // 3. RENDER TAGS BOARD
    if (uniqueTagsCount === 0) {
        tagsContainer.innerHTML = `<span class="empty-tags">No tags registered yet. Type #tag in the input.</span>`;
    } else {
        // Sort tags alphabetically
        const sortedTags = Object.keys(tagsMap).sort();
        tagsContainer.innerHTML = sortedTags.map(tag => {
            const count = tagsMap[tag];
            const isActive = state.activeFilterTag === tag ? 'active' : '';
            return `
                <span class="tag-badge ${isActive}" data-tag="${tag}">
                    #${tag} <span class="tag-count">${count}</span>
                </span>
            `;
        }).join('');
        
        // Add click listeners to tags
        tagsContainer.querySelectorAll(".tag-badge").forEach(badge => {
            badge.addEventListener("click", () => {
                const clickedTag = badge.getAttribute("data-tag");
                if (state.activeFilterTag === clickedTag) {
                    state.activeFilterTag = null; // Toggle off
                    document.getElementById("filterStatus").style.display = "none";
                } else {
                    state.activeFilterTag = clickedTag;
                    document.getElementById("filterName").textContent = `#${clickedTag}`;
                    document.getElementById("filterStatus").style.display = "flex";
                }
                render();
            });
        });
    }
    
    // 4. RENDER GRID CARDS
    if (filteredIdeas.length === 0) {
        ideasGrid.innerHTML = `
            <div class="empty-state">
                <i data-lucide="brain-circuit" class="empty-icon"></i>
                <h3>No matching sparks found.</h3>
                <p>Try refining your search terms or selecting a different tag.</p>
            </div>
        `;
    } else {
        ideasGrid.innerHTML = filteredIdeas.map(idea => {
            const parsedMarkdown = marked.parse(idea.content);
            const formattedTime = formatTimestamp(idea.created_at);
            const cardTagsHtml = idea.tags.map(tag => `
                <span class="card-tag" data-tag="${tag}">#${tag}</span>
            `).join('');
            
            return `
                <div class="idea-card" data-id="${idea.id}" data-tags='${JSON.stringify(idea.tags)}'>
                    <div class="idea-content">
                        ${parsedMarkdown}
                    </div>
                    <div class="idea-footer">
                        ${cardTagsHtml ? `<div class="card-tags">${cardTagsHtml}</div>` : ''}
                        <div class="card-meta">
                            <span class="card-time">${formattedTime}</span>
                            <div class="card-actions">
                                <button class="action-btn copy-btn" title="Copy Raw Markdown">
                                    <i data-lucide="copy"></i>
                                </button>
                                <button class="action-btn delete-btn" title="Delete Idea">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Attach action listeners
        ideasGrid.querySelectorAll(".idea-card").forEach(card => {
            const id = card.getAttribute("data-id");
            const idea = state.ideas.find(i => i.id === id);
            
            // Delete button
            card.querySelector(".delete-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                deleteIdea(id);
            });
            
            // Copy button
            card.querySelector(".copy-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                copyToClipboard(idea.content);
            });
            
            // Inner tags filtering click
            card.querySelectorAll(".card-tag").forEach(tagBtn => {
                tagBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const tag = tagBtn.getAttribute("data-tag");
                    state.activeFilterTag = tag;
                    document.getElementById("filterName").textContent = `#${tag}`;
                    document.getElementById("filterStatus").style.display = "flex";
                    render();
                });
            });
            
            // Highlight connections on tag hover (Designer Micro-interaction)
            card.querySelectorAll(".card-tag").forEach(tagBtn => {
                const hoveredTag = tagBtn.getAttribute("data-tag");
                
                tagBtn.addEventListener("mouseenter", () => {
                    ideasGrid.querySelectorAll(".idea-card").forEach(c => {
                        const cardTags = JSON.parse(c.getAttribute("data-tags") || "[]");
                        if (cardTags.includes(hoveredTag)) {
                            c.classList.add("highlighted");
                        }
                    });
                });
                
                tagBtn.addEventListener("mouseleave", () => {
                    ideasGrid.querySelectorAll(".idea-card").forEach(c => {
                        c.classList.remove("highlighted");
                    });
                });
            });
        });
    }
    
    // Process Lucide Icons
    lucide.createIcons();
}

// Clock Update in Footer
function updateClock() {
    const clock = document.getElementById("systemClock");
    if (!clock) return;
    const now = new Date();
    clock.textContent = now.toTimeString().split(' ')[0];
}

// Initializations
document.addEventListener("DOMContentLoaded", () => {
    // 1. Theme Preference Setup
    const vibeSelect = document.getElementById("vibeSelect");
    const savedTheme = localStorage.getItem("neural_vibe") || "theme-obsidian";
    document.body.className = savedTheme;
    vibeSelect.value = savedTheme;
    
    vibeSelect.addEventListener("change", (e) => {
        const theme = e.target.value;
        document.body.className = theme;
        localStorage.setItem("neural_vibe", theme);
    });
    
    // 2. Submit capture hooks
    const ideaInput = document.getElementById("ideaInput");
    const captureBtn = document.getElementById("btnCapture");
    
    captureBtn.addEventListener("click", captureIdea);
    
    // Command shortcut: Ctrl + Enter
    ideaInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            captureIdea();
        }
    });
    
    // 3. Search & filter hooks
    const searchInput = document.getElementById("searchInput");
    const clearSearch = document.getElementById("btnClearSearch");
    
    searchInput.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
        clearSearch.style.display = state.searchQuery ? "block" : "none";
        render();
    });
    
    clearSearch.addEventListener("click", () => {
        searchInput.value = "";
        state.searchQuery = "";
        clearSearch.style.display = "none";
        render();
    });
    
    document.getElementById("btnRemoveFilter").addEventListener("click", () => {
        state.activeFilterTag = null;
        document.getElementById("filterStatus").style.display = "none";
        render();
    });
    
    // 4. Creative Prompt Generator hooks
    cyclePrompt();
    document.getElementById("btnRefreshSpark").addEventListener("click", cyclePrompt);
    
    document.getElementById("btnUseSpark").addEventListener("click", () => {
        const text = document.getElementById("creativePromptText").textContent;
        // Append spark text template into capture box
        ideaInput.value = `> Prompt Spark: ${text}\n\n`;
        ideaInput.focus();
        // Position cursor at end
        ideaInput.selectionStart = ideaInput.selectionEnd = ideaInput.value.length;
    });
    
    // 5. Initialize Clock & Fetch data
    setInterval(updateClock, 1000);
    updateClock();
    fetchIdeas();
});
