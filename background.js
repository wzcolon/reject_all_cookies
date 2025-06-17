class BackgroundService {
  constructor() {
    this.stats = {
      totalRejects: 0,
      sitesProcessed: new Set(),
      lastActivity: Date.now()
    };
    
    this.init();
  }

  init() {
    this.loadStats();
    this.setupMessageListener();
    this.setupInstallListener();
  }

  async loadStats() {
    try {
      const result = await chrome.storage.local.get(['extensionStats']);
      if (result.extensionStats) {
        this.stats = {
          ...this.stats,
          ...result.extensionStats,
          sitesProcessed: new Set(result.extensionStats.sitesProcessed || [])
        };
      }
    } catch (error) {
      console.error('Reject All Cookies: Error loading stats:', error);
    }
  }

  async saveStats() {
    try {
      const statsToSave = {
        ...this.stats,
        sitesProcessed: Array.from(this.stats.sitesProcessed)
      };
      await chrome.storage.local.set({ extensionStats: statsToSave });
    } catch (error) {
      console.error('Reject All Cookies: Error saving stats:', error);
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'buttonClicked') {
        this.handleButtonClick(message, sender);
      } else if (message.action === 'getStats') {
        sendResponse(this.getStats());
      } else if (message.action === 'resetStats') {
        this.resetStats();
        sendResponse({ success: true });
      }
    });
  }

  setupInstallListener() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.handleInstall();
      } else if (details.reason === 'update') {
        this.handleUpdate(details.previousVersion);
      }
    });
  }

  handleInstall() {
    console.log('Reject All Cookies: Extension installed');
    
    // Set default settings
    chrome.storage.sync.set({
      cookieRejectEnabled: true,
      autoMode: true,
      showNotifications: true
    });

    // Show welcome notification
    this.showNotification('Reject All Cookies installed!', 'The extension will now automatically reject cookie consent banners.');
  }

  handleUpdate(previousVersion) {
    console.log(`Reject All Cookies: Extension updated from ${previousVersion}`);
  }

  handleButtonClick(message, sender) {
    if (!sender.tab) return;

    const hostname = new URL(message.url).hostname;
    
    this.stats.totalRejects++;
    this.stats.sitesProcessed.add(hostname);
    this.stats.lastActivity = Date.now();

    console.log(`Reject All Cookies: Button clicked on ${hostname}`, {
      buttonText: message.buttonText,
      url: message.url
    });

    // Save updated stats
    this.saveStats();

    // Show notification if enabled
    this.showClickNotification(hostname, message.buttonText);
  }

  async showClickNotification(hostname, buttonText) {
    try {
      const settings = await chrome.storage.sync.get(['showNotifications']);
      if (settings.showNotifications !== false) {
        this.showNotification(
          `Rejected cookies on ${hostname}`,
          `Clicked: "${buttonText}"`
        );
      }
    } catch (error) {
      // Ignore notification errors
    }
  }

  showNotification(title, message) {
    // Create notification if permissions allow
    try {
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: title,
          message: message
        });
      }
    } catch (error) {
      // Silently ignore notification errors if permission not granted
      console.log('Reject All Cookies: Notifications not available:', error.message);
    }
  }

  getStats() {
    return {
      totalRejects: this.stats.totalRejects,
      sitesCount: this.stats.sitesProcessed.size,
      sites: Array.from(this.stats.sitesProcessed),
      lastActivity: this.stats.lastActivity
    };
  }

  resetStats() {
    this.stats = {
      totalRejects: 0,
      sitesProcessed: new Set(),
      lastActivity: Date.now()
    };
    this.saveStats();
  }
}

// Initialize the background service
new BackgroundService(); 