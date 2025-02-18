# Blockchain-Based Event Ticket Verification System

## Components
1. Smart Contract (Event_Ticket.sol)
   - ERC721-based NFT contract for ticket issuance
   - Functions for ticket event management and verification
   - Built with OpenZeppelin contracts

2. Backend Service
   - Node.js/Express API
   - ethers.js for blockchain interaction
   - Endpoints for issuing and verifying tickets

## Prerequisites

- Node.js (v14 or higher) (use stable version)
- npm
- Hardhat
- Local Ethereum network (Hardhat Network) / testnet access

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/rioyuda02/blockchain-ticket-verification.git
cd blockchain-ticket-verification
```

2. Install dependencies:
```bash
npm install
```

3. Start the RPC server local EVM:
```bash
npx hardhat node
```

4. Set up environment variables (create a .env file):
```
RPC_URL=<your-rpc-url-local>
PRIVATE_KEY=<your-private-key-local>
CONTRACT_ADDRESS=<local-deployed-contract-address>
```

5. 
## Open to New Terminal

Deploy the smart contract:
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network (localhost) / <your-network>
```
Set up environment variables into .env file:
```
CONTRACT_ADDRESS=<local-deployed-contract-address>
```

6. 
## Open to New Terminal
Start Backend Service:
```bash
source .env
npm run dev
```

7. 
## API Endpoints

### Issue Ticket
```bash
POST /api/issue-ticket
Content-Type: application/json

{
    "recipientAddress": "0x...",
    "eventId": "1...",
    "eventName": "Show ....",
    "eventTimestamp": "175....",
    "eventType": "Show"
}
```

### Verify Ticket
```bash
GET /api/verify-ticket/:walletAddress/:eventId
```

## Testing

1. Run smart contract interaction test:
```bash
npx run scripts/interact.js --network localhost
```

2. Test API endpoints using Postman or cURL:
```bash
# Issue ticket
curl -X POST http://localhost:3000/api/ticket/issue-ticket \
-H "Content-Type: application/json" \
-d '{
    "recipientAddress": "0x123...",
    "eventId": "22449010",
    "eventName": "Show Adele",
    "eventTimestamp": "1759986320",
    "eventType": "Show"
}'

# Verify ticket
curl http://localhost:3000/api/ticket/verify-ticket/0x123.../22449010
```

