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

// Modals State
let ideaToDeleteId = null;
let ideaToEditId = null;

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

// Auto-expanding textarea utility
function makeAutoExpanding(textarea) {
    const adjust = () => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    };
    textarea.addEventListener('input', adjust);
    // Initial adjust on load/content set
    adjust();
}

// Recent tags calculation for autocomplete suggestions
function getRecentTags() {
    const tagsMap = {};
    state.ideas.forEach(idea => {
        idea.tags.forEach(tag => {
            tagsMap[tag] = (tagsMap[tag] || 0) + 1;
        });
    });
    // Return tags sorted by frequency
    return Object.keys(tagsMap).sort((a, b) => tagsMap[b] - tagsMap[a]);
}

// Autocomplete suggestions box handler
function setupTagHelper(textarea, helperDiv, containerDiv) {
    const updateSuggestions = () => {
        const text = textarea.value;
        const cursorPos = textarea.selectionStart;
        
        // Find if we are currently typing a word starting with #
        const textBeforeCursor = text.slice(0, cursorPos);
        const words = textBeforeCursor.split(/[\s\n]+/);
        const lastWord = words[words.length - 1];
        
        if (lastWord.startsWith('#')) {
            const partialTag = lastWord.slice(1).toLowerCase();
            const allRecentTags = getRecentTags();
            const matchedTags = allRecentTags.filter(tag => tag.startsWith(partialTag)).slice(0, 5);
            
            if (matchedTags.length > 0) {
                helperDiv.style.display = 'flex';
                containerDiv.innerHTML = matchedTags.map(tag => `
                    <span class="tag-helper-item" data-tag="${tag}">#${tag}</span>
                `).join('');
                
                // Add click listener for autocomplete selection
                containerDiv.querySelectorAll('.tag-helper-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const clickedTag = item.getAttribute('data-tag');
                        const startPos = cursorPos - lastWord.length;
                        const textAfterCursor = text.slice(cursorPos);
                        
                        // Insert clicked tag
                        textarea.value = text.slice(0, startPos) + '#' + clickedTag + ' ' + textAfterCursor;
                        textarea.focus();
                        
                        // Set cursor position after the autocomplete tag and space
                        const newCursorPos = startPos + clickedTag.length + 2;
                        textarea.setSelectionRange(newCursorPos, newCursorPos);
                        
                        helperDiv.style.display = 'none';
                        // Re-trigger expansion adjust
                        textarea.style.height = 'auto';
                        textarea.style.height = textarea.scrollHeight + 'px';
                    });
                });
            } else {
                helperDiv.style.display = 'none';
            }
        } else {
            helperDiv.style.display = 'none';
        }
    };
    
    textarea.addEventListener('input', updateSuggestions);
    textarea.addEventListener('keyup', (e) => {
        // Close on escape
        if (e.key === 'Escape') {
            helperDiv.style.display = 'none';
        }
    });
}

// Custom Modals Handling
function openDeleteModal(id) {
    ideaToDeleteId = id;
    const idea = state.ideas.find(i => i.id === id);
    if (!idea) return;
    
    // Set preview text
    document.getElementById("deleteCardPreview").textContent = idea.content.length > 180 
        ? idea.content.slice(0, 180) + "..." 
        : idea.content;
    
    document.getElementById("deleteModal").classList.add("show");
}

function closeDeleteModal() {
    document.getElementById("deleteModal").classList.remove("show");
    ideaToDeleteId = null;
}

function openEditModal(id) {
    ideaToEditId = id;
    const idea = state.ideas.find(i => i.id === id);
    if (!idea) return;
    
    const editInput = document.getElementById("editInput");
    editInput.value = idea.content;
    
    document.getElementById("editModal").classList.add("show");
    
    // Recalculate height and focus
    editInput.focus();
    editInput.style.height = 'auto';
    editInput.style.height = editInput.scrollHeight + 'px';
}

function closeEditModal() {
    document.getElementById("editModal").classList.remove("show");
    document.getElementById("editTagHelper").style.display = "none";
    ideaToEditId = null;
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
    
    const btn = document.getElementById("btnCapture");
    
    // Disable inputs (Network request latency UX)
    input.disabled = true;
    btn.disabled = true;
    btn.classList.add("loading");
    
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
        input.style.height = 'auto'; // Reset size
        showToast("Spark captured successfully.");
        await fetchIdeas();
    } catch (error) {
        console.error(error);
        showToast("Failed to save spark.");
    } finally {
        // Re-enable inputs
        input.disabled = false;
        btn.disabled = false;
        btn.classList.remove("loading");
        input.focus();
    }
}

// API: Save edited idea
async function saveEditedIdea() {
    if (!ideaToEditId) return;
    const editInput = document.getElementById("editInput");
    const content = editInput.value.trim();
    if (!content) return;
    
    const saveBtn = document.getElementById("btnSaveEdit");
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = "SAVING...";
    
    try {
        const response = await fetch(`/api/ideas/${ideaToEditId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ content: content })
        });
        
        if (!response.ok) throw new Error("Failed to save changes.");
        
        showToast("Spark updated successfully.");
        closeEditModal();
        await fetchIdeas();
    } catch (error) {
        console.error(error);
        showToast("Could not update spark.");
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

// API: Delete idea
async function confirmDeleteIdea() {
    if (!ideaToDeleteId) return;
    
    try {
        const response = await fetch(`/api/ideas/${ideaToDeleteId}`, {
            method: "DELETE"
        });
        
        if (!response.ok) throw new Error("Failed to delete idea.");
        
        showToast("Spark de-orbited.");
        closeDeleteModal();
        await fetchIdeas();
    } catch (error) {
        console.error(error);
        showToast("Could not remove spark.");
    }
}

// Data Export: Download database as JSON backup
function exportBackupJson() {
    if (state.ideas.length === 0) {
        showToast("Archive is empty. Nothing to export.");
        return;
    }
    const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.ideas, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", `neural_brain_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("JSON database backup downloaded.");
}

// Data Export: Download database as Markdown archive index
function exportBackupMarkdown() {
    if (state.ideas.length === 0) {
        showToast("Archive is empty. Nothing to export.");
        return;
    }
    let mdContent = `# Neural Archive Index - Exported ${new Date().toLocaleDateString()}\n\n`;
    state.ideas.forEach(idea => {
        const formattedTime = new Date(idea.created_at).toLocaleString();
        const tagsList = idea.tags.map(t => `#${t}`).join(' ');
        mdContent += `## Spark ${idea.id.slice(0, 8)} - ${formattedTime}\n`;
        mdContent += `${idea.content}\n\n`;
        if (tagsList) {
            mdContent += `*Tags: ${tagsList}*\n\n`;
        }
        mdContent += `---\n\n`;
    });
    
    const mdString = "data:text/markdown;charset=utf-8," + encodeURIComponent(mdContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", mdString);
    downloadAnchor.setAttribute("download", `neural_brain_archive_${new Date().toISOString().split('T')[0]}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Markdown archive index downloaded.");
}

// Copy raw text of idea to clipboard
function copyToClipboard(content) {
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
        let actionHtml = '';
        if (state.searchQuery || state.activeFilterTag) {
            actionHtml = `<button class="empty-search-recovery-btn" id="btnResetFilters">Clear Search & Filters</button>`;
        }
        ideasGrid.innerHTML = `
            <div class="empty-state">
                <i data-lucide="brain-circuit" class="empty-icon"></i>
                <h3>No matching sparks found.</h3>
                <p>Try refining your search terms or selecting a different tag.</p>
                ${actionHtml}
            </div>
        `;
        
        if (state.searchQuery || state.activeFilterTag) {
            document.getElementById("btnResetFilters").addEventListener("click", () => {
                state.searchQuery = "";
                state.activeFilterTag = null;
                document.getElementById("searchInput").value = "";
                document.getElementById("btnClearSearch").style.display = "none";
                document.getElementById("filterStatus").style.display = "none";
                render();
            });
        }
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
                                <button class="action-btn edit-btn" title="Edit Idea">
                                    <i data-lucide="edit-3"></i>
                                </button>
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
            
            // Edit button
            card.querySelector(".edit-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                openEditModal(id);
            });
            
            // Delete button
            card.querySelector(".delete-btn").addEventListener("click", (e) => {
                e.stopPropagation();
                openDeleteModal(id);
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
    // 1. Theme Switches Setup
    const themeSwitches = document.getElementById("themeSwitches");
    const savedTheme = localStorage.getItem("neural_vibe") || "theme-obsidian";
    document.body.className = savedTheme;
    
    // Set active theme button
    themeSwitches.querySelectorAll(".theme-btn").forEach(btn => {
        if (btn.getAttribute("data-theme") === savedTheme) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
        
        btn.addEventListener("click", () => {
            themeSwitches.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const theme = btn.getAttribute("data-theme");
            document.body.className = theme;
            localStorage.setItem("neural_vibe", theme);
            showToast(`VIBE SWAPPED: ${theme.replace("theme-", "").toUpperCase()}`);
        });
    });
    
    // 2. Textareas Auto-expansion and focus on load
    const ideaInput = document.getElementById("ideaInput");
    const editInput = document.getElementById("editInput");
    
    makeAutoExpanding(ideaInput);
    makeAutoExpanding(editInput);
    
    // Auto-focus main input on page load (Ease of Use)
    ideaInput.focus();
    
    // 3. Autocomplete Suggested Tags Box
    setupTagHelper(ideaInput, document.getElementById("tagHelper"), document.getElementById("suggestedTagsContainer"));
    setupTagHelper(editInput, document.getElementById("editTagHelper"), document.getElementById("editSuggestedTagsContainer"));
    
    // 4. Modal event listeners
    // Cancel buttons
    document.getElementById("btnCancelDelete").addEventListener("click", closeDeleteModal);
    document.getElementById("btnConfirmCancelDelete").addEventListener("click", closeDeleteModal);
    document.getElementById("btnCancelEdit").addEventListener("click", closeEditModal);
    document.getElementById("btnConfirmCancelEdit").addEventListener("click", closeEditModal);
    
    // Action confirmations
    document.getElementById("btnConfirmDelete").addEventListener("click", confirmDeleteIdea);
    document.getElementById("btnSaveEdit").addEventListener("click", saveEditedIdea);
    
    // Close modal on background overlay click
    document.querySelectorAll(".modal-overlay").forEach(overlay => {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                closeDeleteModal();
                closeEditModal();
            }
        });
    });
    
    // Modal hotkey Escape listener
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            closeDeleteModal();
            closeEditModal();
        }
    });
    
    // 5. Submit capture hooks
    const captureBtn = document.getElementById("btnCapture");
    captureBtn.addEventListener("click", captureIdea);
    
    // Command shortcut: Ctrl + Enter
    ideaInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            captureIdea();
        }
    });
    
    editInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.ctrlKey) {
            e.preventDefault();
            saveEditedIdea();
        }
    });
    
    // 6. Search & filter hooks
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
    
    // 7. Data export buttons hooks
    document.getElementById("btnExportJson").addEventListener("click", exportBackupJson);
    document.getElementById("btnExportMarkdown").addEventListener("click", exportBackupMarkdown);
    
    // 8. Creative Prompt Generator hooks
    cyclePrompt();
    document.getElementById("btnRefreshSpark").addEventListener("click", cyclePrompt);
    
    document.getElementById("btnUseSpark").addEventListener("click", () => {
        const text = document.getElementById("creativePromptText").textContent;
        ideaInput.value = `> Prompt Spark: ${text}\n\n`;
        ideaInput.focus();
        // Position cursor at end and trigger height adjust
        ideaInput.selectionStart = ideaInput.selectionEnd = ideaInput.value.length;
        ideaInput.style.height = 'auto';
        ideaInput.style.height = ideaInput.scrollHeight + 'px';
    });
    
    // 9. Initialize Clock & Fetch data
    setInterval(updateClock, 1000);
    updateClock();
    fetchIdeas();
});
