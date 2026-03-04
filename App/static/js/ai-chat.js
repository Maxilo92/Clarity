(function () {
    const API_URL = '/api/chat';

    // --- 1. GET USER AND STORAGE REFERENCES ---
    const userStr = localStorage.getItem('clarityUser');
    let userId = 'guest', companyId = null, userName = 'User';
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            userId = user.id || 'guest';
            companyId = user.company_id || null;
            userName = user.full_name || 'User';
        } catch (e) {
            console.error("Could not parse user from localStorage", e);
        }
    }
    const STORAGE_KEY = `clair_chat_history_${userId}`;

    // --- 2. DOM ELEMENT REFERENCES ---
    // Use the new, simpler IDs from the embedded chat module
    const chatHistoryContainer = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('chat-send-btn');
    
    // Check if the chat elements are on the page before proceeding
    if (!chatHistoryContainer || !chatInput || !sendButton) {
        // Not on the insights page, so do nothing.
        return;
    }

    let chatHistory = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    // --- 3. CORE FUNCTIONS ---

    /**
     * Appends a message to the chat UI and optionally saves it to history.
     * @param {string} text - The message content.
     * @param {'user' | 'clair'} role - The sender's role.
     * @param {boolean} [save=true] - Whether to save to localStorage.
     */
    function appendMessage(text, role, save = true) {
        if (!text) return;

        const cleanText = text
            .replace(/(QUERY|ADD_TRANSACTION):[\s\n]*\{[\s\S]*?\}/gi, '')
            .trim();

        if (!cleanText) return;
        
        const messageEl = document.createElement('div');
        messageEl.classList.add('message', `${role}-message`);
        messageEl.innerHTML = `<p>${cleanText}</p>`; // Simple paragraph-based messages

        chatHistoryContainer.appendChild(messageEl);
        chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;

        if (save) {
            chatHistory.push({ role, content: text });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory.slice(-20)));
        }
    }

    /**
     * Sends the user's message to the backend and displays the response.
     */
    async function sendMessage() {
        const userText = chatInput.value.trim();
        if (!userText) return;

        appendMessage(userText, 'user');
        chatInput.value = '';
        
        // Show typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message', 'clair-message', 'typing');
        typingIndicator.innerHTML = '<p>Clair is typing...</p>';
        chatHistoryContainer.appendChild(typingIndicator);
        chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;

        try {
            const messages = [
                { role: 'system', content: 'You are Clair, a helpful financial assistant.' },
                ...chatHistory.map(m => ({ role: m.role, content: m.content }))
            ];
            
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages, company_id: companyId, user_id: userId })
            });

            if (!response.ok) throw new Error(`Server error: ${response.status}`);

            const data = await response.json();
            const reply = data.choices[0].message.content;

            // Process backend markers
            const queryMatch = reply.match(/QUERY:\s*(\{[\s\S]*?\})/);
            if (queryMatch) {
                const query = JSON.parse(queryMatch[1]);
                document.dispatchEvent(new CustomEvent('forceFilter', { detail: query }));
            }
            if (reply.includes("ADD_TRANSACTION")) {
                document.dispatchEvent(new Event('dataUpdated'));
            }

            appendMessage(reply, 'clair');

        } catch (error) {
            appendMessage('Sorry, I am having trouble connecting. Please try again later.', 'clair', false);
            console.error("Chat API error:", error);
        } finally {
            // Remove typing indicator
            chatHistoryContainer.removeChild(typingIndicator);
        }
    }

    // --- 4. EVENT LISTENERS ---
    sendButton.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // --- 5. INITIALIZATION ---
    function initializeChat() {
        chatHistoryContainer.innerHTML = ''; // Clear any static content
        if (chatHistory.length === 0) {
            appendMessage("Hello! I'm Clair. Ask me anything about your finances.", 'clair', true);
        } else {
            chatHistory.forEach(msg => appendMessage(msg.content, msg.role, false));
        }
    }

    initializeChat();

})();
