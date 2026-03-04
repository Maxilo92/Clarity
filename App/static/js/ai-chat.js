(function () {
    const API_PROXY = '/api/chat';

    // Get user details
    const userStr = localStorage.getItem('clarityUser');
    let userId = 'guest';
    let companyId = null;
    let userName = 'User';
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.id) userId = user.id;
            if (user.company_id) companyId = user.company_id;
            if (user.full_name) userName = user.full_name;
        } catch(e) {}
    }

    const STORAGE_KEY = `clair_chat_history_${userId}`;
    let chatHistory = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    let isPanelOpen = false;

    const SYSTEM_PROMPT = `You are Clair, an intelligent financial advisor for "Clarity". 
Address the user naturally. 

### DIRECTIVES:
1. To SEARCH: add QUERY:{"category": "string", "date": "YYYY-MM-DD", "name": "search term"}
2. To ADD TRANSACTION: add ADD_TRANSACTION:{"name": "Item", "amount": -12.99, "category": "Groceries", "date": "ISO8601"}
   - EXPENSES must be NEGATIVE numbers (e.g., -2.99 for milk).
   - INCOME must be POSITIVE.
3. Add these markers at the VERY END of your message.
4. Never show technical JSON to the user.
5. Brevity: max 3 sentences.`;

    document.body.insertAdjacentHTML('beforeend', `
        <div class="ai-chat-overlay" id="aiChatOverlay"></div>
        <aside class="ai-chat-panel" id="aiChatPanel" aria-label="Clair">
            <div class="ai-chat-header">
                <div class="ai-chat-header-content">
                    <div class="ai-chat-title" id="aiChatTitle" style="cursor:pointer" title="Über Clair">
                        <div class="ai-chat-icon-container">
                            <img src="../assets/icons/joule_logo.png" alt="Clair">
                            <div class="ai-chat-online-indicator"></div>
                        </div>
                        <div class="ai-chat-title-text">
                            <span class="ai-chat-name">Clair</span>
                            <span class="ai-chat-status">KI-Assistent</span>
                        </div>
                    </div>
                    <div class="ai-chat-controls">
                        <button id="aiChatClear" class="ai-chat-control-btn" title="Chat löschen">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </button>
                        <button id="aiChatClose" class="ai-chat-control-btn ai-chat-close-btn" title="Schließen">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="ai-chat-messages" id="aiChatMessages"></div>
            
            <div class="ai-chat-footer">
                <div class="ai-chat-input-area">
                    <div class="ai-chat-input-wrapper">
                        <textarea id="aiChatInput" placeholder="Frage Clair..." rows="1"></textarea>
                        <button id="aiChatSend" class="ai-chat-send-button" title="Senden">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </div>
                    <div class="ai-chat-disclaimer">Clair kann Fehler machen. Überprüfe wichtige Infos.</div>
                </div>
            </div>
        </aside>

        <!-- Clair Profile Modal -->
        <div class="clair-profile-modal" id="clairProfileModal">
            <div class="clair-profile-overlay" id="clairProfileOverlay"></div>
            <div class="clair-profile-card">
                <button class="clair-profile-close" id="clairProfileClose">&times;</button>
                <div class="clair-profile-header">
                    <div class="clair-profile-avatar">
                        <img src="../assets/icons/joule_logo.png" alt="Clair">
                    </div>
                    <h2>Clair</h2>
                    <p>Finanz-Expertin & KI-Assistentin</p>
                </div>
                <div class="clair-profile-body">
                    <div class="clair-info-item">
                        <div class="clair-info-icon">🧠</div>
                        <div class="clair-info-text">
                            <strong>Expertise</strong>
                            <span>Finanzanalyse, Budgetierung, Ausgabentrends</span>
                        </div>
                    </div>
                    <div class="clair-info-item">
                        <div class="clair-info-icon">⚡</div>
                        <div class="clair-info-text">
                            <strong>Reaktionszeit</strong>
                            <span>Echtzeit (Millisekunden)</span>
                        </div>
                    </div>
                    <div class="clair-info-item">
                        <div class="clair-info-icon">🔐</div>
                        <div class="clair-info-text">
                            <strong>Datenschutz</strong>
                            <span>Sicher & verschlüsselt</span>
                        </div>
                    </div>
                    <div class="clair-info-bio">
                        Clair ist deine persönliche KI-Assistentin bei Clarity. Sie hilft dir dabei, deine Finanzen besser zu verstehen, Anomalien zu erkennen und kluge finanzielle Entscheidungen zu treffen.
                    </div>
                </div>
                <div class="clair-profile-footer">
                    <button class="clair-contact-btn" id="clairContactAction">Chat starten</button>
                </div>
            </div>
        </div>
    `);

    const panel = document.getElementById('aiChatPanel');
    const overlay = document.getElementById('aiChatOverlay');
    const messagesContainer = document.getElementById('aiChatMessages');
    const input = document.getElementById('aiChatInput');
    const sendBtn = document.getElementById('aiChatSend');
    const clearBtn = document.getElementById('aiChatClear');
    const closeBtn = document.getElementById('aiChatClose');
    
    // Profile Modal Elements
    const chatTitle = document.getElementById('aiChatTitle');
    const profileModal = document.getElementById('clairProfileModal');
    const profileOverlay = document.getElementById('clairProfileOverlay');
    const profileClose = document.getElementById('clairProfileClose');
    const contactAction = document.getElementById('clairContactAction');

    function openChat() { 
        panel.classList.add('open'); 
        overlay.classList.add('open'); 
        isPanelOpen = true; 
        input.focus();
    }
    function closeChat() { panel.classList.remove('open'); overlay.classList.remove('open'); isPanelOpen = false; }

    function openProfile() { profileModal.classList.add('open'); }
    function closeProfile() { profileModal.classList.remove('open'); }

    chatTitle.onclick = openProfile;
    profileOverlay.onclick = closeProfile;
    profileClose.onclick = closeProfile;
    contactAction.onclick = () => { closeProfile(); openChat(); };

    overlay.onclick = closeChat;
    closeBtn.onclick = closeChat;
    clearBtn.onclick = () => { 
        if(confirm("Möchtest du den gesamten Chat-Verlauf löschen?")) { 
            chatHistory=[]; 
            localStorage.removeItem(STORAGE_KEY); 
            messagesContainer.innerHTML=""; 
            appendMessage("Hallo! Ich bin Clair. Wie kann ich dir heute bei deinen Finanzen helfen?", "assistant"); 
        } 
    };

    document.addEventListener('attachToClair', (e) => {
        const t = e.detail.transaction;
        if (!t) return;
        openChat();
        input.value = `Ich habe eine Frage zu dieser Transaktion: ${t.kategorie} (${t.wert}€) vom ${new Date(t.timestamp).toLocaleDateString()}. `;
        input.focus();
        input.style.height = 'auto';
        input.style.height = input.scrollHeight + 'px';
    });

    const setupBtn = () => { 
        const b = document.querySelector('.diamond-btn'); 
        if(b) b.onclick = openChat; 
        else setTimeout(setupBtn, 100); 
    };
    setupBtn();

    input.oninput = function () { 
        this.style.height = 'auto'; 
        this.style.height = Math.min(this.scrollHeight, 120) + 'px'; 
    };
    input.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
    sendBtn.onclick = sendMessage;

    function appendMessage(text, role, save = true, timestamp = null) {
        if (!text) return;
        let cleanText = text.replace(/(QUERY|ADD_TRANSACTION):[\s\n]*\{[\s\S]*?\}/gi, '').trim();
        if (!cleanText && role === 'assistant') return;

        const msg = document.createElement('div');
        msg.className = `ai-message ai-message--${role==='user'?'user':'bot'}`;
        
        const content = role === 'assistant' && typeof marked !== 'undefined' ? marked.parse(cleanText) : cleanText;
        
        const avatar = role === 'user' ? 
            `<div class="ai-message-avatar user-avatar">${userName.charAt(0).toUpperCase()}</div>` : 
            '<div class="ai-message-avatar bot-avatar-small"><img src="../assets/icons/joule_logo.png" alt="C"></div>';

        const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        msg.innerHTML = `
            ${avatar}
            <div class="ai-message-bubble-container">
                <div class="ai-message-bubble">${content}</div>
                <div class="ai-message-time">${timeStr}</div>
            </div>
        `;
        messagesContainer.appendChild(msg);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        if (save) { 
            const newMsg = { role, content: text, time: new Date().getTime() };
            chatHistory.push(newMsg); 
            localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory.slice(-20))); 
        }
    }

    if (chatHistory.length === 0) appendMessage("Hallo! Ich bin Clair. Wie kann ich dir heute bei deinen Finanzen helfen?", "assistant", true);
    else chatHistory.forEach(m => appendMessage(m.content, m.role, false, m.time));

    async function sendMessage() {
        const text = input.value.trim(); if (!text) return;
        input.value = ''; input.style.height = 'auto';
        appendMessage(text, 'user');
        
        const typing = document.createElement('div');
        typing.className = 'ai-message ai-message--bot ai-typing';
        typing.innerHTML = `
            <div class="ai-message-avatar bot-avatar-small"><img src="../assets/icons/joule_logo.png" alt="C"></div>
            <div class="ai-message-bubble-container">
                <div class="ai-message-bubble">
                    <div class="ai-typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typing);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const fullMessages = [
                { role: 'system', content: SYSTEM_PROMPT },
                ...chatHistory.map(m => ({ role: m.role, content: m.content }))
            ];

            const res = await fetch(API_PROXY, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: fullMessages, company_id: companyId, user_id: userId })
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error?.message || errData.error || `Server error ${res.status}`);
            }
            const data = await res.json();
            let reply = data.choices[0].message.content;
            
            // Clean markers from reply before showing to user
            const cleanedReply = reply.replace(/(QUERY|ADD_TRANSACTION|FILTER_DASHBOARD|GET_SPENDING_ANALYSIS):\{.*?\}/g, '').trim();
            
            typing.remove();
            appendMessage(cleanedReply, 'assistant');

            const qM = reply.match(/QUERY:\s*(\{[\s\S]*?\})/);
            if (qM) {
                const c = JSON.parse(qM[1]);
                document.dispatchEvent(new CustomEvent('forceFilter', { detail: { category: c.category, date: c.date, search: c.name } }));
            }

            const tM = reply.match(/ADD_TRANSACTION:\s*(\{[\s\S]*?\})/);
            if (tM) {
                console.log("[Chat] Transaction marker found:", tM[0]);
                try {
                    // Note: The backend already inserted the transaction for native tools.
                    // We just trigger a UI refresh and show a toast here.
                    console.log("[Chat] Transaction added by backend. Refreshing UI.");
                    document.dispatchEvent(new Event('dataUpdated'));
                    
                    // Small visual confirmation
                    const toast = document.createElement('div');
                    toast.className = 'ai-chat-toast';
                    toast.textContent = 'Transaktion hinzugefügt!';
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 3000);
                } catch (e) { console.error("[Chat] Error processing transaction marker", e); }
            }
        } catch (e) { 
            console.error("[Chat API Error]", e);
            typing.remove();
            appendMessage(`Entschuldigung, ich habe gerade Verbindungsprobleme. (Details: ${e.message})`, "assistant", false);
        }
    }

})();
