class PopupManager {
  constructor() {
    this.elements = {};
    this.settings = {};
    this.stats = {};
    
    this.init();
  }

  init() {
    this.bindElements();
    this.setupEventListeners();
    this.loadSettings();
    this.loadStats();
    this.updateDisplay();
  }

  bindElements() {
    this.elements = {
      enabledToggle: document.getElementById('enabledToggle'),
      notificationsToggle: document.getElementById('notificationsToggle'),
      autoModeToggle: document.getElementById('autoModeToggle'),
      statusIndicator: document.getElementById('statusIndicator'),
      statusText: document.getElementById('statusText'),
      totalRejects: document.getElementById('totalRejects'),
      sitesCount: document.getElementById('sitesCount'),
      lastActivity: document.getElementById('lastActivity'),
      recentSitesList: document.getElementById('recentSitesList'),
      resetStatsBtn: document.getElementById('resetStatsBtn'),
      testBtn: document.getElementById('testBtn')
    };
  }

  setupEventListeners() {
    // Toggle switches
    this.elements.enabledToggle.addEventListener('change', (e) => {
      this.updateSetting('cookieRejectEnabled', e.target.checked);
      this.updateStatusDisplay();
    });

    this.elements.notificationsToggle.addEventListener('change', (e) => {
      this.updateSetting('showNotifications', e.target.checked);
    });

    this.elements.autoModeToggle.addEventListener('change', (e) => {
      this.updateSetting('autoMode', e.target.checked);
    });

    // Action buttons
    this.elements.resetStatsBtn.addEventListener('click', () => {
      this.resetStats();
    });

    this.elements.testBtn.addEventListener('click', () => {
      this.testCurrentPage();
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'cookieRejectEnabled',
        'showNotifications',
        'autoMode'
      ]);

      this.settings = {
        cookieRejectEnabled: result.cookieRejectEnabled !== false,
        showNotifications: result.showNotifications !== false,
        autoMode: result.autoMode !== false
      };

      // Update UI elements
      this.elements.enabledToggle.checked = this.settings.cookieRejectEnabled;
      this.elements.notificationsToggle.checked = this.settings.showNotifications;
      this.elements.autoModeToggle.checked = this.settings.autoMode;

    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getStats' });
      if (response) {
        this.stats = response;
        this.updateStatsDisplay();
        this.updateRecentSites();
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async updateSetting(key, value) {
    this.settings[key] = value;
    
    try {
      await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
    }
  }

  updateDisplay() {
    this.updateStatusDisplay();
    this.updateStatsDisplay();
    this.updateRecentSites();
  }

  updateStatusDisplay() {
    const isEnabled = this.settings.cookieRejectEnabled;
    const statusDot = this.elements.statusIndicator.querySelector('.status-dot');
    
    if (isEnabled) {
      this.elements.statusText.textContent = 'Active';
      this.elements.statusText.classList.remove('inactive');
      statusDot.classList.remove('inactive');
    } else {
      this.elements.statusText.textContent = 'Disabled';
      this.elements.statusText.classList.add('inactive');
      statusDot.classList.add('inactive');
    }
  }

  updateStatsDisplay() {
    this.elements.totalRejects.textContent = this.stats.totalRejects || 0;
    this.elements.sitesCount.textContent = this.stats.sitesCount || 0;
    
    if (this.stats.lastActivity) {
      const lastActivity = new Date(this.stats.lastActivity);
      const now = new Date();
      const diffHours = Math.floor((now - lastActivity) / (1000 * 60 * 60));
      
      let activityText;
      if (diffHours < 1) {
        activityText = 'Active within the last hour';
      } else if (diffHours < 24) {
        activityText = `Last active ${diffHours} hours ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        activityText = `Last active ${diffDays} days ago`;
      }
      
      this.elements.lastActivity.textContent = activityText;
    } else {
      this.elements.lastActivity.textContent = 'No recent activity';
    }
  }

  updateRecentSites() {
    const sitesList = this.elements.recentSitesList;
    
    if (!this.stats.sites || this.stats.sites.length === 0) {
      sitesList.innerHTML = '<p class="no-sites">No sites processed yet</p>';
      return;
    }

    // Show up to 5 most recent sites
    const recentSites = this.stats.sites.slice(-5).reverse();
    
    sitesList.innerHTML = recentSites.map(site => `
      <div class="site-item">
        <span class="site-name">${this.truncateDomain(site)}</span>
        <span class="site-count">Protected</span>
      </div>
    `).join('');
  }

  truncateDomain(domain) {
    if (domain.length > 25) {
      return domain.substring(0, 22) + '...';
    }
    return domain;
  }

  async resetStats() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'resetStats' });
      if (response && response.success) {
        this.stats = {
          totalRejects: 0,
          sitesCount: 0,
          sites: [],
          lastActivity: null
        };
        this.updateDisplay();
        this.showToast('Statistics reset successfully');
      }
    } catch (error) {
      console.error('Error resetting stats:', error);
      this.showToast('Error resetting statistics', 'error');
    }
  }

  async testCurrentPage() {
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        this.showToast('No active tab found', 'error');
        return;
      }

      // Inject and execute test script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.testPageFunction
      });

      this.showToast('Test executed on current page');
      
      // Refresh stats after a short delay
      setTimeout(() => {
        this.loadStats();
      }, 2000);

    } catch (error) {
      console.error('Error testing current page:', error);
      this.showToast('Error testing page', 'error');
    }
  }

  // Function to be injected into the current page for testing
  testPageFunction() {
    // Create a test banner to verify the extension works
    const testBanner = document.createElement('div');
    testBanner.id = 'cookie-reject-test-banner';
    testBanner.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #ccc;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 999999;
      font-family: Arial, sans-serif;
      max-width: 400px;
    `;
    
    testBanner.innerHTML = `
      <h3 style="margin-bottom: 10px;">Cookie Consent Test</h3>
      <p style="margin-bottom: 15px;">This is a test banner to verify the extension works.</p>
      <div style="display: flex; gap: 10px;">
        <button id="test-accept" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">Accept All</button>
        <button id="test-reject" style="padding: 8px 16px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; background: #f0f0f0;">Reject All</button>
      </div>
    `;
    
    document.body.appendChild(testBanner);
    
    // Remove the banner after 5 seconds if not clicked
    setTimeout(() => {
      if (document.getElementById('cookie-reject-test-banner')) {
        document.body.removeChild(testBanner);
      }
    }, 5000);
    
    // Add click handlers to remove banner
    testBanner.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        document.body.removeChild(testBanner);
      }
    });
  }

  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      padding: 10px 15px;
      border-radius: 6px;
      color: white;
      font-size: 12px;
      z-index: 10000;
      transition: all 0.3s;
      ${type === 'error' ? 'background: #dc3545;' : 'background: #28a745;'}
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 2000);
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
}); 