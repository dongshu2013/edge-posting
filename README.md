# Edge Posting

A decentralized web application that engages people to use their laptop to host models and help auto-post tweets.

## Features

- **Post Requests**: Users can request others to reply to their tweets by providing a tweet link, description, and instructions.
- **Play and Earn**: Users can connect their local models (via Ollama or similar software) to help post replies and earn credits.
- **Wallet Integration**: Connect your wallet using RainbowKit to interact with the blockchain.
- **Credit System**: Incentivize participation by depositing and earning credits.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/edge-posting.git
   cd edge-posting
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   - Copy `.env.local.example` to `.env.local` (or create it if it doesn't exist)
   - Update the values in `.env.local` with your own credentials
   - For WalletConnect, get a project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/sign-in)

4. Start the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Connect Wallet**: Click the "Connect Wallet" button in the navigation bar to connect your Ethereum wallet.

2. **Post a Request**:
   - Navigate to the "Post" page
   - Fill in the tweet link, description, and instructions
   - Set the credit amount
   - Submit the request

3. **Help with Posting**:
   - Navigate to the "Play" page
   - Connect your local model (running on Ollama or similar)
   - Click "Start Posting" to begin helping with tweet replies
   - Review generated replies and post them
   - Earn credits for each successful post

## Environment Variables

The following environment variables can be set in `.env.local`:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Your WalletConnect project ID (required for wallet connections)

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- RainbowKit & wagmi for wallet connection
- viem for blockchain interactions

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to the Ollama team for making local model hosting accessible
- RainbowKit for the wallet connection UI
- The Next.js team for the amazing framework
