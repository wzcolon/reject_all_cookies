# 🍪 Reject All Cookies - Chrome Extension

A Chrome extension that automatically detects and rejects cookie consent banners on websites, protecting your privacy by default.

## Features

- **Automatic Detection**: Intelligently detects cookie consent banners from popular frameworks (OneTrust, Cookiebot, Quantcast, etc.)
- **Smart Rejection**: Automatically clicks "Reject All" or equivalent buttons
- **Comprehensive Coverage**: Supports 15+ major cookie consent management platforms
- **Statistics Tracking**: Keep track of how many sites have been protected
- **Manual Control**: Easy on/off toggle and settings management
- **Test Mode**: Test the extension on any page with a simulated banner
- **Privacy Focused**: All processing happens locally, no data is sent to external servers

## Supported Cookie Consent Platforms

- OneTrust
- Cookiebot
- Quantcast Choice (CMP)
- TrustArc
- Didomi
- Cookiefirst
- Termly
- Osano
- Usercentrics
- Custom implementations

## Installation

### From Source (Developer Mode)

1. **Download the Extension**
   ```bash
       git clone https://github.com/yourusername/reject-all-cookies.git
    cd reject-all-cookies
   ```

2. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the extension directory
   - The extension should now appear in your extensions list

4. **Pin the Extension** (Optional)
   - Click the puzzle piece icon in Chrome toolbar
   - Find "Reject All Cookies" and click the pin icon

### From Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store after review.

## Usage

### Automatic Mode (Default)

Once installed, the extension works automatically:

1. Visit any website with a cookie consent banner
2. The extension detects the banner within 1-2 seconds
3. It automatically clicks the "Reject All" button
4. The banner disappears and your privacy settings are saved

### Manual Controls

Click the extension icon to access the popup interface:

- **Enable/Disable**: Toggle automatic rejection on/off
- **View Statistics**: See how many cookies you've rejected
- **Settings**: Configure notifications and auto-mode
- **Test Function**: Test the extension on the current page
- **Reset Stats**: Clear your usage statistics

### Settings

- **Auto Mode**: Automatically reject cookies (enabled by default)
- **Show Notifications**: Display notifications when cookies are rejected
- **Extension Status**: See if the extension is active

## How It Works

### Detection Algorithm

1. **DOM Monitoring**: Uses MutationObserver to detect new elements
2. **Pattern Matching**: Identifies cookie banners using:
   - Element selectors (class names, IDs, data attributes)
   - Text content analysis
   - Framework-specific patterns
3. **Button Detection**: Locates reject buttons using:
   - Semantic selectors (`data-testid`, `aria-label`)
   - CSS class patterns
   - Text content matching

### Rejection Process

1. **Validation**: Ensures the button is visible and clickable
2. **Multiple Methods**: Uses both `.click()` and synthetic events
3. **Verification**: Avoids clicking "Accept" buttons by analyzing text content
4. **Logging**: Records successful rejections for statistics

## Architecture

### File Structure

```
reject-all-cookies/
├── manifest.json           # Extension configuration
├── content-script.js       # Main detection and rejection logic
├── background.js          # Background service worker
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── popup.css             # Popup styling
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Key Classes

- **CookieRejectService**: Main content script service
- **BackgroundService**: Handles extension lifecycle and statistics
- **PopupManager**: Manages popup interface and user interactions

## Development

### Building from Source

No build process required - the extension uses vanilla JavaScript.

### Testing

1. Load the extension in developer mode
2. Visit websites with cookie banners
3. Use the "Test on Current Page" button to create a simulated banner
4. Check browser console for debug messages

### Adding New Selectors

To support additional cookie frameworks, edit `content-script.js`:

1. Add selectors to the `rejectSelectors` array
2. Add banner detection patterns to `bannerSelectors` array
3. Test with websites using that framework

## Privacy & Security

- **No External Requests**: All processing happens locally
- **No Data Collection**: The extension doesn't collect or transmit user data
- **Minimal Permissions**: Only requests necessary Chrome API permissions
- **Open Source**: Code is fully auditable

## Permissions Explained

- **activeTab**: Access current tab to detect and interact with cookie banners
- **storage**: Store user preferences and statistics locally
- **scripting**: Inject test functionality (used only for manual testing)

## Browser Compatibility

- Chrome 88+ (Manifest V3 required)
- Chromium-based browsers (Edge, Brave, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Adding Support for New Platforms

If you encounter a cookie consent platform that isn't supported:

1. Open browser developer tools
2. Find the banner element and reject button selectors
3. Add them to the appropriate arrays in `content-script.js`
4. Test and submit a pull request

## Troubleshooting

### Extension Not Working

1. Check if extension is enabled in `chrome://extensions/`
2. Verify the site has a supported cookie banner type
3. Try manually disabling and re-enabling the extension
4. Check browser console for error messages

### False Positives

If the extension incorrectly identifies elements:

1. Disable the extension temporarily
2. Report the issue with the website URL
3. Use the toggle to turn off auto-mode if needed

### Performance Issues

The extension is designed to be lightweight, but if you experience issues:

1. Check statistics to see if unusually high activity
2. Reset statistics if they're very large
3. Disable and re-enable if needed

## Legal Notice

This extension is designed to help users exercise their legal right to reject cookies under GDPR and similar privacy regulations. Users are responsible for understanding the implications of rejecting cookies on website functionality.

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: Report bugs on GitHub Issues
- **Feature Requests**: Submit via GitHub Issues
- **Questions**: Check existing issues or create a new one

---

**Made with ❤️ for privacy** 