class CookieRejectService {
  constructor() {
    this.isEnabled = true;
    this.processedBanners = new Set();
    this.rejectSelectors = [
      // Common "Reject All" button selectors
      '[data-testid*="reject"]',
      '[data-testid*="decline"]',
      '[data-testid*="deny"]',
      '[aria-label*="reject" i]',
      '[aria-label*="decline" i]',
      '[aria-label*="deny" i]',
      'button[class*="reject" i]',
      'button[class*="decline" i]',
      'button[class*="deny" i]',
      'button[id*="reject" i]',
      'button[id*="decline" i]',
      'button[id*="deny" i]',
      // Common cookie consent framework selectors
      '.cmp-reject-all-button',
      '.reject-all-cookies',
      '.cookie-reject-all',
      '.gdpr-reject-all',
      '#rejectAllCookies',
      '#declineAllCookies',
      '#denyAllCookies',
      // OneTrust selectors
      '#onetrust-reject-all-handler',
      '.onetrust-reject-all-handler',
      '.ot-reject-all-handler',
      // Cookiebot selectors
      '#CybotCookiebotDialogBodyButtonDecline',
      '.CybotCookiebotDialogBodyButton[data-function="decline"]',
      // Quantcast selectors
      '.qc-cmp2-summary-buttons button[mode="secondary"]',
      '.qc-cmp2-summary-buttons .qc-cmp2-reject-all',
      // TrustArc selectors
      '#truste-consent-required .truste-button2',
      '.truste-consent-required .truste-button2',
      // Didomi selectors
      '.didomi-button-secondary',
      '.didomi-popup-notice-buttons .didomi-button:nth-child(2)',
      // Cookiefirst selectors
      '.cookiefirst-button-secondary',
      '.cookiefirst-reject-all',
      // Termly selectors
      '.termly-reject-all-button',
      '#termly-code-snippet-reject-all',
      // Osano selectors
      '.osano-cm-reject-all',
      '.osano-cm-denyAll',
      // Usercentrics selectors
      '[data-testid="uc-deny-all-button"]',
      '.uc-deny-all-button'
    ];
    
    this.init();
  }

  init() {
    this.loadSettings();
    this.observeForBanners();
    this.processBannersOnLoad();
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['cookieRejectEnabled']);
      this.isEnabled = result.cookieRejectEnabled !== false;
    } catch (error) {
      console.log('Reject All Cookies: Using default settings');
    }
  }

  observeForBanners() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.processBanner(node);
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  processBannersOnLoad() {
    // Wait a bit for the page to load then check for existing banners
    setTimeout(() => {
      this.processBanner(document.body);
    }, 1000);
  }

  processBanner(element) {
    if (!this.isEnabled) return;

    const banner = this.detectCookieBanner(element);
    if (banner && !this.processedBanners.has(banner)) {
      this.processedBanners.add(banner);
      this.handleBanner(banner);
    }
  }

  detectCookieBanner(element) {
    // Common cookie banner indicators
    const bannerSelectors = [
      '[class*="cookie" i]',
      '[class*="consent" i]',
      '[class*="gdpr" i]',
      '[class*="privacy" i]',
      '[id*="cookie" i]',
      '[id*="consent" i]',
      '[id*="gdpr" i]',
      '[id*="privacy" i]',
      '[aria-label*="cookie" i]',
      '[aria-label*="consent" i]',
      '[aria-label*="privacy" i]',
      // Framework-specific selectors
      '#onetrust-consent-sdk',
      '.onetrust-pc-container',
      '#CybotCookiebotDialog',
      '.qc-cmp2-container',
      '#truste-consent-track',
      '.didomi-notice',
      '.cookiefirst-root',
      '.termly-styles',
      '.osano-cm-window',
      '[data-consent-manager]',
      '.uc-banner-wrap'
    ];

    // Check if this element or any child contains a cookie banner
    for (const selector of bannerSelectors) {
      const banner = element.matches && element.matches(selector) ? element : element.querySelector(selector);
      if (banner) {
        return banner;
      }
    }

    return null;
  }

  handleBanner(banner) {
    // Add a small delay to ensure the banner is fully rendered
    setTimeout(() => {
      const rejectButton = this.findRejectButton(banner);
      if (rejectButton) {
        this.clickRejectButton(rejectButton);
      }
    }, 500);
  }

  findRejectButton(banner) {
    // First try to find buttons within the banner
    for (const selector of this.rejectSelectors) {
      const button = banner.querySelector(selector);
      if (button && this.isValidRejectButton(button)) {
        return button;
      }
    }

    // If not found in banner, try the entire document (some banners are split)
    for (const selector of this.rejectSelectors) {
      const button = document.querySelector(selector);
      if (button && this.isValidRejectButton(button)) {
        return button;
      }
    }

    // Try text-based matching as fallback
    const buttons = banner.querySelectorAll('button, a, div[role="button"], span[role="button"]');
    for (const button of buttons) {
      if (this.isRejectButtonByText(button)) {
        return button;
      }
    }

    return null;
  }

  isValidRejectButton(button) {
    // Check if button is visible and clickable
    if (!button || button.style.display === 'none' || button.hidden) {
      return false;
    }

    const rect = button.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  isRejectButtonByText(button) {
    const text = button.textContent || button.innerText || '';
    const ariaLabel = button.getAttribute('aria-label') || '';
    const title = button.getAttribute('title') || '';
    
    const combinedText = (text + ' ' + ariaLabel + ' ' + title).toLowerCase();
    
    const rejectTexts = [
      'reject all',
      'reject cookies',
      'decline all',
      'decline cookies',
      'deny all',
      'deny cookies',
      'refuse all',
      'refuse cookies',
      'no cookies',
      'essential only',
      'necessary only',
      'reject',
      'decline',
      'deny',
      'refuse'
    ];

    // Avoid accept buttons
    const acceptTexts = ['accept', 'allow', 'agree', 'consent', 'ok', 'continue', 'confirm'];
    
    for (const acceptText of acceptTexts) {
      if (combinedText.includes(acceptText)) {
        return false;
      }
    }

    for (const rejectText of rejectTexts) {
      if (combinedText.includes(rejectText)) {
        return true;
      }
    }

    return false;
  }

  clickRejectButton(button) {
    try {
      console.log('Reject All Cookies: Clicking reject button', button);
      
      // Try multiple click methods to ensure compatibility
      button.click();
      
      // Dispatch synthetic events as backup
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      button.dispatchEvent(clickEvent);

      // Send message to background script for logging
      chrome.runtime.sendMessage({
        action: 'buttonClicked',
        url: window.location.href,
        buttonText: button.textContent || button.innerText || 'Unknown'
      }).catch(() => {
        // Ignore errors if background script is not available
      });

    } catch (error) {
      console.error('Reject All Cookies: Error clicking button', error);
    }
  }
}

// Initialize the service when the script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new CookieRejectService();
  });
} else {
  new CookieRejectService();
} 