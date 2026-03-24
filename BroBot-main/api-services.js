// API Services for OpenAI and ElevenLabs

class APIServices {
    constructor() {
        this.conversationHistory = [];
    }

    /**
     * Get a response from OpenAI GPT-4o with the rude personality
     */
    async getAssistantResponse(userMessage) {
        try {
            // Add user message to history
            this.conversationHistory.push({
                role: 'user',
                content: userMessage
            });

            // Call OpenAI API
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: CONFIG.OPENAI_MODEL,
                    messages: [
                        {
                            role: 'system',
                            content: CONFIG.SYSTEM_PROMPT
                        },
                        ...this.conversationHistory
                    ],
                    temperature: 1.2, // Higher temperature for more creative/random responses
                    max_tokens: 200
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const assistantMessage = data.choices[0].message.content;

            // Add assistant response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: assistantMessage
            });

            // Keep conversation history manageable (last 10 messages)
            if (this.conversationHistory.length > 10) {
                this.conversationHistory = this.conversationHistory.slice(-10);
            }

            return assistantMessage;
        } catch (error) {
            console.error('Error getting assistant response:', error);
            throw error;
        }
    }

    /**
     * Convert text to speech using ElevenLabs API
     */
    async textToSpeech(text) {
        try {
            const response = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${CONFIG.ELEVENLABS_VOICE_ID}`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': CONFIG.ELEVENLABS_API_KEY
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: 'eleven_multilingual_v2',
                        output_format: 'mp3_44100_128',
                        voice_settings: {
                            stability: 0.75,
                            similarity_boost: 1.0,
                            style: 0.0,
                            use_speaker_boost: true
                        }
                    })
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs API error: ${response.statusText} - ${errorText}`);
            }

            // Return audio blob
            const audioBlob = await response.blob();
            return URL.createObjectURL(audioBlob);
        } catch (error) {
            console.error('Error generating speech:', error);
            throw error;
        }
    }

    /**
     * Analyze sentiment to determine avatar mood
     */
    analyzeSentiment(text) {
        const lowerText = text.toLowerCase();

        // Check for angry/annoyed words
        const annoyedWords = ['ugh', 'seriously', 'whatever', 'annoying', 'stupid', 'dumb', 'wrong'];
        const isAnnoyed = annoyedWords.some(word => lowerText.includes(word));

        if (isAnnoyed) {
            return 'annoyed';
        }

        // Default to talking when generating response
        return 'talking';
    }

    /**
     * Count how many times "bro" appears in text
     */
    countBros(text) {
        const matches = text.toLowerCase().match(/\bbro\b/g);
        return matches ? matches.length : 0;
    }

    /**
     * Reset conversation history
     */
    resetConversation() {
        this.conversationHistory = [];
    }
}

// Create global instance
const apiServices = new APIServices();
