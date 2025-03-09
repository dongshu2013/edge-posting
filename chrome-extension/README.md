# BUZZ Reply Helper Chrome Extension

A Chrome extension that automates the reply process for the Edge Posting platform, helping users earn BUZZ tokens more efficiently.

## Features

- **Auto-Reply**: Automatically opens Twitter/X.com with the tweet to reply to and prefills the reply text.
- **One-Click Submission**: Automatically submits the reply URL back to Edge Posting.
- **Earnings Tracker**: Keeps track of your earned BUZZ tokens.
- **Customizable Settings**: Configure auto-submit and tab closing preferences.

## Installation

### From Chrome Web Store (Coming Soon)

1. Visit the Chrome Web Store
2. Search for "BUZZ Reply Helper"
3. Click "Add to Chrome"

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the `chrome-extension` folder
5. The extension should now appear in your toolbar

## Usage

1. **Connect to Edge Posting**:
   - Click the extension icon in your toolbar
   - Click "Connect to Edge Posting"
   - If you're not already on the Edge Posting site, it will open in a new tab

2. **Auto-Reply to Tweets**:
   - On the Edge Posting play page, you'll see "Auto Reply" buttons next to each buzz request
   - Click the button to automatically open Twitter, fill in a reply, and submit it
   - The extension will capture the reply URL and submit it back to Edge Posting

3. **Configure Settings**:
   - Auto-submit replies: Enable/disable automatic submission of replies
   - Auto-close Twitter tab: Enable/disable automatic closing of Twitter tabs after replying

## How It Works

1. The extension adds "Auto Reply" buttons to buzz requests on the Edge Posting platform
2. When clicked, it generates a reply based on the instructions (using your connected model if available)
3. It opens Twitter in a new tab with the tweet to reply to
4. It automatically clicks the reply button, fills in the text, and submits the reply
5. It captures the URL of the reply tweet
6. It submits the reply URL back to Edge Posting
7. It tracks your earnings and displays them in the popup

## Privacy & Permissions

This extension requires the following permissions:
- `activeTab`: To interact with the current tab
- `scripting`: To inject scripts into Twitter pages
- `tabs`: To open and manage tabs
- `storage`: To store settings and earnings data

The extension only interacts with Twitter/X.com and the Edge Posting platform.

## Support

If you encounter any issues or have suggestions for improvements, please open an issue on the GitHub repository.

## License

MIT License 