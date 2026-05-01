const onboardingForm = document.getElementById('onboarding-form');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatMessages = document.getElementById('chat-messages');
const onboardingSection = document.getElementById('onboarding');
const chatSection = document.getElementById('chat-container');
const exitBtn = document.getElementById('exit-btn');

let userContext = {
    name: '',
    age: '',
    state: '',
    registered: ''
};

let conversationHistory = [];

// Handle onboarding form submission
onboardingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    userContext.name = document.getElementById('name').value;
    userContext.age = document.getElementById('age').value;
    userContext.state = document.getElementById('state').value;
    userContext.registered = document.querySelector('input[name="registered"]:checked').value;
    
    // Hide onboarding, show chat
    onboardingSection.classList.add('hidden');
    chatSection.classList.remove('hidden');
    
    // Initial message based on context
    sendInitialQuery();
});

// Handle exit button
exitBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to exit the chat? Your conversation history will be cleared.')) {
        // Reset context
        userContext = { name: '', age: '', state: '', registered: '' };
        conversationHistory = [];
        
        // Clear chat messages (except initial assistant message)
        chatMessages.innerHTML = `
            <div class="message assistant">
                <div class="bubble">Hello! I'm VoteWise. How can I help you today?</div>
            </div>
        `;
        
        // Reset form
        onboardingForm.reset();
        
        // Toggle sections
        chatSection.classList.add('hidden');
        onboardingSection.classList.remove('hidden');
    }
});

async function sendInitialQuery() {
    const greeting = `Hi! My name is ${userContext.name}. I'm ${userContext.age} years old and I live in ${userContext.state}. I am ${userContext.registered === 'yes' ? '' : 'not '}registered to vote. Can you tell me what I should do next?`;
    addMessage('user', `Hi! I'm ${userContext.name}. I've shared my details. What are my next steps?`);
    await fetchResponse(greeting);
}

// Handle chat form submission
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = userInput.value.trim();
    if (!text || userInput.disabled) return;
    
    userInput.value = '';
    userInput.disabled = true;
    document.getElementById('send-btn').disabled = true;
    
    addMessage('user', text);
    await fetchResponse(text);
    
    userInput.disabled = false;
    document.getElementById('send-btn').disabled = false;
    userInput.focus();
});

function addMessage(role, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;
    msgDiv.innerHTML = `<div class="bubble">${text}</div>`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgDiv.querySelector('.bubble');
}

async function fetchResponse(text) {
    // Add assistant bubble placeholder
    const bubble = addMessage('assistant', '');
    bubble.textContent = '...';
    
    conversationHistory.push({ role: 'user', content: text });

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: conversationHistory,
                context: userContext
            })
        });

        if (!response.ok) {
            bubble.textContent = 'Sorry, something went wrong. Please try again.';
            return;
        }

        bubble.textContent = ''; // Clear loading state
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') break;
                    
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.token) {
                            bubble.textContent += parsed.token;
                            fullContent += parsed.token;
                            chatMessages.scrollTop = chatMessages.scrollHeight;
                        } else if (parsed.error) {
                            bubble.textContent = `Error: ${parsed.error}`;
                        }
                    } catch (e) {
                        // Ignore parse errors for partial chunks
                    }
                }
            }
        }
        
        conversationHistory.push({ role: 'assistant', content: fullContent });

    } catch (err) {
        bubble.textContent = 'Error connecting to server. Check your connection.';
        console.error(err);
    }
}
