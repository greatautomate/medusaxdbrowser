
class MedusaXDBrowser {
    constructor() {
        this.currentSession = null;
        this.browserClient = null;
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.newSessionBtn = document.getElementById("newSessionBtn");
        this.terminateBtn = document.getElementById("terminateBtn");
        this.sessionStatus = document.getElementById("sessionStatus");
        this.deviceType = document.getElementById("deviceType");
        this.navigationUrl = document.getElementById("navigationUrl");
        this.navigateBtn = document.getElementById("navigateBtn");
        this.browserFrame = document.getElementById("browserFrame");
        this.loadingIndicator = document.getElementById("loadingIndicator");
    }

    attachEventListeners() {
        this.newSessionBtn.addEventListener("click", () => this.createSession());
        this.terminateBtn.addEventListener("click", () => this.terminateSession());
        this.navigateBtn.addEventListener("click", () => this.navigateToUrl());
        this.navigationUrl.addEventListener("keypress", (e) => {
            if (e.key === "Enter") this.navigateToUrl();
        });
    }

    showLoading() {
        this.loadingIndicator.classList.add("show");
    }

    hideLoading() {
        this.loadingIndicator.classList.remove("show");
    }

    updateSessionStatus(status) {
        this.sessionStatus.textContent = status;
    }

    async createSession() {
        this.showLoading();
        this.newSessionBtn.disabled = true;

        try {
            const userAgent = this.deviceType.value === "mobile" ? "chrome_android" : undefined;
            
            const response = await fetch("/api/create-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    user_agent: userAgent,
                    timeout_inactive: 300000, // 5 minutes
                    timeout_absolute: 3600000, // 1 hour
                    profile: true
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentSession = {
                    session_id: data.session_id,
                    embed_url: data.embed_url
                };

                await this.embedBrowser(data.embed_url);
                this.updateSessionStatus(`Active Session: ${data.session_id.substring(0, 8)}...`);
                this.terminateBtn.disabled = false;
                this.navigateBtn.disabled = false;
            } else {
                throw new Error(data.error || "Failed to create session");
            }
        } catch (error) {
            console.error("Session creation failed:", error);
            alert("Failed to create browser session. Please try again.");
            this.updateSessionStatus("Session creation failed");
        } finally {
            this.hideLoading();
            this.newSessionBtn.disabled = false;
        }
    }

    async embedBrowser(embedUrl) {
        // Clear existing content
        this.browserFrame.innerHTML = "";
        
        // Create container for the browser
        const browserContainer = document.createElement("div");
        browserContainer.style.width = "100%";
        browserContainer.style.height = "100%";
        this.browserFrame.appendChild(browserContainer);

        // Initialize browser client
        this.browserClient = await window.Hyperbeam(browserContainer, embedUrl, {
            delegate: {
                onTabChange: (tab) => {
                    console.log("Tab changed:", tab);
                }
            }
        });

        console.log("MedusaXD Browser initialized successfully");
    }

    async navigateToUrl() {
        if (!this.browserClient || !this.navigationUrl.value.trim()) {
            alert("Please enter a valid URL and ensure a browser session is active");
            return;
        }

        try {
            let url = this.navigationUrl.value.trim();
            
            // Add protocol if missing
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "https://" + url;
            }

            await this.browserClient.tabs.update({ url });
            this.navigationUrl.value = "";
        } catch (error) {
            console.error("Navigation failed:", error);
            alert("Failed to navigate to URL");
        }
    }

    async terminateSession() {
        if (!this.currentSession) return;

        this.showLoading();
        
        try {
            const response = await fetch(`/api/session/${this.currentSession.session_id}`, {
                method: "DELETE"
            });

            const data = await response.json();

            if (data.success) {
                this.currentSession = null;
                this.browserClient = null;
                this.browserFrame.innerHTML = `
                    <div class="placeholder">
                        <div class="placeholder-content">
                            <h2>Session Terminated</h2>
                            <p>Click "New Session" to start browsing again</p>
                        </div>
                    </div>
                `;
                this.updateSessionStatus("No active session");
                this.terminateBtn.disabled = true;
                this.navigateBtn.disabled = true;
            } else {
                throw new Error(data.error || "Failed to terminate session");
            }
        } catch (error) {
            console.error("Session termination failed:", error);
            alert("Failed to terminate session");
        } finally {
            this.hideLoading();
        }
    }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    new MedusaXDBrowser();
});

