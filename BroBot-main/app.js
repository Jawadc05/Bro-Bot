// Main Application Logic

class SarcasticAssistant {
    constructor() {
        // DOM elements
        this.chatMessages = document.getElementById('chatMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendButton');
        this.statusIndicator = document.getElementById('statusIndicator');
        this.statusText = document.getElementById('statusText');
        this.avatar = document.getElementById('avatar');
        this.avatarNext = document.getElementById('avatarNext');
        this.videoPlaceholder = document.getElementById('videoPlaceholder');
        this.currentMood = document.getElementById('currentMood');
        this.broCountDisplay = document.getElementById('broCount');
        this.ttsAudio = document.getElementById('ttsAudio');

        // Brainrot mode elements
        this.brainrotToggle = document.getElementById('brainrotToggle');
        this.brainrotWindow = document.getElementById('brainrotWindow');
        this.brainrotVideo = document.getElementById('brainrotVideo');
        this.closeBrainrot = document.getElementById('closeBrainrot');

        // State
        this.isProcessing = false;
        this.totalBroCount = 1; // Initial message contains one "bro"
        this.currentVideoElement = this.avatar;
        this.nextVideoElement = this.avatarNext;
        this.preloadedVideos = {};
        this.videosLoaded = false;
        this.shouldPlay67Video = false;

        // Brainrot mode state
        this.isBrainrotActive = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        // Initialize
        this.init();
    }

    init() {
        // Event listeners
        this.sendButton.addEventListener('click', () => this.handleSend());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.isProcessing) {
                this.handleSend();
            }
        });

        // Set initial avatar state
        this.currentEmotionVideo = null;
        this.userHasInteracted = false;

        // Fallback: try to play video on first user interaction if autoplay was blocked
        const startVideoOnInteraction = () => {
            if (!this.userHasInteracted) {
                this.userHasInteracted = true;
                console.log('User interaction detected, attempting to play video');
                if (this.avatar.paused) {
                    this.avatar.play().catch(err => console.log('Could not start video:', err));
                }
            }
        };
        document.addEventListener('click', startVideoOnInteraction, { once: true });
        document.addEventListener('keydown', startVideoOnInteraction, { once: true });

        // Set up initial video
        this.avatar.src = 'videos/Blinking.mov';
        this.avatar.load();

        // Video error handling
        this.avatar.addEventListener('error', (e) => {
            console.error('Primary video failed to load:', e);
            this.showVideoPlaceholder();
        });

        this.avatar.addEventListener('loadeddata', () => {
            console.log('Primary video loaded successfully');
            this.hideVideoPlaceholder();
            this.videosLoaded = true;
            // Explicitly play the video once it's loaded
            this.avatar.play()
                .then(() => console.log('Video playing'))
                .catch(err => {
                    console.log('Autoplay prevented, will start on user interaction:', err);
                });
        });

        // Preload all videos for smooth transitions
        this.preloadVideos();

        // Setup Brainrot mode controls
        this.setupBrainrotMode();

        // Audio event listeners
        this.ttsAudio.addEventListener('play', () => {
            this.setAvatarMood('talking');
        });

        this.ttsAudio.addEventListener('ended', () => {
            // Check if we should play the 67 video
            if (this.shouldPlay67Video) {
                this.play67Video();
                this.shouldPlay67Video = false; // Reset flag
            } else if (this.currentEmotionVideo) {
                // Play emotion video based on current mood, then return to idle
                this.playEmotionVideo(this.currentEmotionVideo);
            } else {
                this.setAvatarMood('idle');
            }
        });

        console.log('Sarcastic Assistant initialized!');
    }

    showVideoPlaceholder() {
        if (this.videoPlaceholder) {
            this.videoPlaceholder.classList.remove('hidden');
        }
    }

    hideVideoPlaceholder() {
        if (this.videoPlaceholder) {
            this.videoPlaceholder.classList.add('hidden');
        }
    }

    preloadVideos() {
        // List of all video files to preload
        const videoFiles = [
            'videos/Blinking.mov',
            'videos/Talking.mov',
            'videos/ShakeHead.mov',
            'videos/EyeBrowRaise.mov',
            'videos/Smile.mov',
            'videos/Disturbed.mov',
            'videos/67.mov'
        ];

        let loadedCount = 0;
        const totalVideos = videoFiles.length;

        videoFiles.forEach(videoPath => {
            const video = document.createElement('video');
            video.src = videoPath;
            video.muted = true;
            video.preload = 'auto';
            video.playsInline = true;
            this.preloadedVideos[videoPath] = video;

            video.addEventListener('loadeddata', () => {
                loadedCount++;
                console.log(`Loaded ${loadedCount}/${totalVideos}: ${videoPath}`);
            });

            video.addEventListener('error', () => {
                console.warn(`Failed to load: ${videoPath}`);
            });

            // Start loading the video
            video.load();
        });

        console.log('Preloading videos for smooth transitions...');
    }

    async handleSend() {
        const userMessage = this.userInput.value.trim();

        if (!userMessage || this.isProcessing) {
            return;
        }

        // Mark user interaction
        this.userHasInteracted = true;

        // Validate API keys
        if (!this.validateConfig()) {
            this.addMessage('assistant', 'Error: API keys not configured. Check config.js file.');
            return;
        }

        this.isProcessing = true;
        this.sendButton.disabled = true;
        this.userInput.value = '';

        try {
            // Add user message to chat
            this.addMessage('user', userMessage);

            // Check if message contains "6 7" or "67" to trigger 67 video
            const normalizedMessage = userMessage.toLowerCase().replace(/\s+/g, ' ');
            this.shouldPlay67Video = normalizedMessage.includes('6 7') ||
                                     normalizedMessage.includes('67') ||
                                     normalizedMessage.includes('six seven') ||
                                     normalizedMessage.includes('sixseven');

            // Show loading status
            this.showStatus('Generating sarcastic response...');

            // Set avatar to annoyed while thinking
            this.setAvatarMood('annoyed');

            // Get response from OpenAI
            const assistantResponse = await apiServices.getAssistantResponse(userMessage);

            // Update status
            this.showStatus('Synthesizing voice with attitude...');

            // Add assistant message to chat
            this.addMessage('assistant', assistantResponse);

            // Count and update "bro" count
            const broCount = apiServices.countBros(assistantResponse);
            if (broCount > 0) {
                this.totalBroCount += broCount;
                this.broCountDisplay.textContent = this.totalBroCount;
                this.animateBroCounter();
            }

            // Analyze sentiment for mood and map to emotion video
            const mood = apiServices.analyzeSentiment(assistantResponse);
            this.currentMood.textContent = this.getMoodLabel(mood);

            // Map mood to emotion video (will play after talking ends)
            this.currentEmotionVideo = this.getEmotionVideoFromMood(mood, assistantResponse);

            // Generate and play TTS
            try {
                const audioUrl = await apiServices.textToSpeech(assistantResponse);
                this.ttsAudio.src = audioUrl;
                await this.ttsAudio.play();
            } catch (ttsError) {
                console.error('TTS Error:', ttsError);
                // Continue even if TTS fails
                this.setAvatarMood('idle');
                this.currentEmotionVideo = null;
            }

            this.hideStatus();

        } catch (error) {
            console.error('Error:', error);
            this.addMessage('assistant', `Error: ${error.message}. Check your API keys in config.js.`);
            this.hideStatus();
            this.setAvatarMood('idle');
        } finally{
            this.isProcessing = false;
            this.sendButton.disabled = false;
            this.userInput.focus();
        }
    }

    addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;

        const labelDiv = document.createElement('div');
        labelDiv.className = 'message-label';
        labelDiv.textContent = role === 'assistant' ? 'Assistant' : 'You';

        const textP = document.createElement('p');
        textP.className = 'message-text';
        textP.textContent = content;

        messageDiv.appendChild(labelDiv);
        messageDiv.appendChild(textP);

        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    setAvatarMood(mood) {
        // Map mood to video file
        const videoMap = {
            'idle': 'videos/Blinking.mov',
            'talking': 'videos/Talking.mov',
            'annoyed': 'videos/Disturbed.mov'
        };

        const videoSrc = videoMap[mood] || videoMap['idle'];
        this.switchVideo(videoSrc, true);
    }

    switchVideo(videoPath, shouldLoop = true) {
        // Use only the main avatar element - no crossfade
        const video = this.avatar;

        // If already on this video, just ensure it's playing
        if (video.src.endsWith(videoPath)) {
            if (video.paused) {
                video.play().catch(err => console.log('Play error:', err));
            }
            return;
        }

        // Switch to new video
        video.src = videoPath;
        video.loop = shouldLoop;
        video.load();

        // Play when ready
        video.addEventListener('loadeddata', () => {
            video.play().catch(err => console.log('Play error:', err));
        }, { once: true });
    }

    playEmotionVideo(emotionType) {
        const emotionMap = {
            'ShakeHead': 'videos/ShakeHead.mov',
            'EyeBrowRaise': 'videos/EyeBrowRaise.mov',
            'Smile': 'videos/Smile.mov',
            'Disturbed': 'videos/Disturbed.mov'
        };

        const videoSrc = emotionMap[emotionType];
        if (!videoSrc) {
            this.setAvatarMood('idle');
            return;
        }

        // Play emotion video once (not looped)
        this.switchVideo(videoSrc, false);

        // Return to idle after emotion video ends
        const onEmotionEnd = () => {
            this.setAvatarMood('idle');
            this.avatar.removeEventListener('ended', onEmotionEnd);
            this.currentEmotionVideo = null;
        };

        this.avatar.addEventListener('ended', onEmotionEnd);
    }

    play67Video() {
        console.log('Playing 67 video...');
        // Play 67 video once (not looped)
        this.switchVideo('videos/67.mov', false);

        // Return to idle after 67 video ends
        const on67End = () => {
            this.setAvatarMood('idle');
            this.avatar.removeEventListener('ended', on67End);
        };

        this.avatar.addEventListener('ended', on67End);
    }

    getMoodLabel(mood) {
        const moodLabels = {
            'idle': 'Annoyed',
            'talking': 'Condescending',
            'annoyed': 'Extra Annoyed',
            'happy': 'Smugly Satisfied',
            'confused': 'Perplexed',
            'sarcastic': 'Deeply Sarcastic'
        };
        return moodLabels[mood] || 'Annoyed';
    }

    getEmotionVideoFromMood(mood, responseText) {
        // Map sentiment/mood to emotion videos
        // This determines which emotion video plays after talking ends

        // Check for specific keywords or moods
        const lowerText = responseText.toLowerCase();

        if (mood === 'happy' || lowerText.includes('haha') || lowerText.includes('lol')) {
            return 'Smile';
        } else if (mood === 'confused' || lowerText.includes('what') || lowerText.includes('huh')) {
            return 'EyeBrowRaise';
        } else if (mood === 'annoyed' || lowerText.includes('ugh') || lowerText.includes('seriously')) {
            return 'ShakeHead';
        } else if (lowerText.includes('disturb') || lowerText.includes('weird')) {
            return 'Disturbed';
        } else {
            // Random emotion selection for variety
            const emotions = ['Smile', 'EyeBrowRaise', 'ShakeHead', 'Disturbed'];
            return emotions[Math.floor(Math.random() * emotions.length)];
        }
    }

    showStatus(message) {
        this.statusText.textContent = message;
        this.statusIndicator.classList.remove('hidden');
    }

    hideStatus() {
        this.statusIndicator.classList.add('hidden');
    }

    animateBroCounter() {
        this.broCountDisplay.classList.add('bro-explode');
        setTimeout(() => {
            this.broCountDisplay.classList.remove('bro-explode');
        }, 500);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupBrainrotMode() {
        // Toggle button click
        this.brainrotToggle.addEventListener('click', () => {
            this.toggleBrainrotMode();
        });

        // Close button
        this.closeBrainrot.addEventListener('click', () => {
            this.toggleBrainrotMode();
        });

        // Drag functionality - make entire window draggable
        this.brainrotWindow.addEventListener('mousedown', (e) => {
            this.startDragging(e);
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.drag(e);
            }
        });

        document.addEventListener('mouseup', () => {
            this.stopDragging();
        });

        // Set video source
        this.brainrotVideo.src = 'videos/Subway.mp4';
        this.brainrotVideo.load();

        // Handle video errors
        this.brainrotVideo.addEventListener('error', (e) => {
            console.error('Brainrot video failed to load:', e);
            console.log('Make sure "Subway.mov" exists in the videos folder');
        });
    }

    toggleBrainrotMode() {
        this.isBrainrotActive = !this.isBrainrotActive;

        if (this.isBrainrotActive) {
            // Show window and play video
            this.brainrotWindow.classList.remove('hidden');
            this.brainrotToggle.classList.add('active');
            this.brainrotVideo.play().catch(err => {
                console.log('Brainrot video play error:', err);
            });
        } else {
            // Hide window and pause video
            this.brainrotWindow.classList.add('hidden');
            this.brainrotToggle.classList.remove('active');
            this.brainrotVideo.pause();
        }
    }

    startDragging(e) {
        this.isDragging = true;
        const rect = this.brainrotWindow.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
        this.brainrotWindow.classList.add('dragging');
    }

    drag(e) {
        if (!this.isDragging) return;

        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;

        // Keep within viewport
        const maxX = window.innerWidth - this.brainrotWindow.offsetWidth;
        const maxY = window.innerHeight - this.brainrotWindow.offsetHeight;

        const boundedX = Math.max(0, Math.min(x, maxX));
        const boundedY = Math.max(0, Math.min(y, maxY));

        this.brainrotWindow.style.left = boundedX + 'px';
        this.brainrotWindow.style.top = boundedY + 'px';
        this.brainrotWindow.style.right = 'auto';
        this.brainrotWindow.style.bottom = 'auto';
    }

    stopDragging() {
        this.isDragging = false;
        this.brainrotWindow.classList.remove('dragging');
    }

    validateConfig() {
        console.log('Validating config...');
        console.log('CONFIG object:', CONFIG);

        const hasOpenAI = CONFIG.OPENAI_API_KEY &&
                         CONFIG.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY_HERE' &&
                         CONFIG.OPENAI_API_KEY !== 'your_openai_api_key_here';
        const hasElevenLabs = CONFIG.ELEVENLABS_API_KEY &&
                             CONFIG.ELEVENLABS_API_KEY !== 'YOUR_ELEVENLABS_API_KEY_HERE' &&
                             CONFIG.ELEVENLABS_API_KEY !== 'your_elevenlabs_api_key_here' &&
                             CONFIG.ELEVENLABS_VOICE_ID &&
                             CONFIG.ELEVENLABS_VOICE_ID !== 'YOUR_VOICE_ID_HERE' &&
                             CONFIG.ELEVENLABS_VOICE_ID !== 'your_voice_id_here';

        console.log('hasOpenAI:', hasOpenAI);
        console.log('hasElevenLabs:', hasElevenLabs);

        if (!hasOpenAI || !hasElevenLabs) {
            console.error('API keys not configured properly!');
            console.error('OpenAI key check failed:', !hasOpenAI);
            console.error('ElevenLabs key check failed:', !hasElevenLabs);
            return false;
        }

        return true;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SarcasticAssistant();
});
