class MedusaXDBrowser {
    constructor() {
        this.currentSession = null;
        this.browserClient = null;
        this.initializeElements();
        this.attachEventListeners();
    }

    // ... existing methods ...

    async createSession() {
        this.showLoading();
        this.newSessionBtn.disabled = true;

        try {
            // Try enhanced session creation first
            let response = await fetch('/api/create-enhanced-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_agent: this.deviceType.value === 'mobile' ? 'chrome_android' : undefined
                })
            });

            let data = await response.json();

            if (data.success) {
                this.currentSession = {
                    session_id: data.session_id,
                    embed_url: data.embed_url,
                    config_level: data.config_level
                };

                await this.embedBrowser(data.embed_url);

                let statusMessage = `Active Session: ${data.session_id.substring(0, 8)}...`;
                if (data.config_level > 1) {
                    statusMessage += ` (Basic Mode)`;
                }

                this.updateSessionStatus(statusMessage);
                this.terminateBtn.disabled = false;
                this.navigateBtn.disabled = false;

                // Show info about restricted features
                if (data.config_level > 1) {
                    this.showFeatureNotice();
                }
            } else {
                throw new Error(data.error || 'Failed to create session');
            }
        } catch (error) {
            console.error('Session creation failed:', error);
            alert('Failed to create browser session. Please try again.');
            this.updateSessionStatus('Session creation failed');
        } finally {
            this.hideLoading();
            this.newSessionBtn.disabled = false;
        }
    }

    showFeatureNotice() {
        const notice = document.createElement('div');
        notice.className = 'feature-notice';
        notice.innerHTML = `
            <div class="notice-content">
                <h4>⚠️ Running in Basic Mode</h4>
                <p>Some advanced features are restricted. Session persistence and custom timeouts are not available.</p>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        document.body.appendChild(notice);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notice.parentElement) {
                notice.remove();
            }
        }, 5000);
    }

    // ... rest of existing methods ...
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new MedusaXDBrowser();
});
