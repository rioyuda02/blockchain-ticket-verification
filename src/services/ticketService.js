const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

class TicketService {
    constructor() {
        this.initializeContract();
    }

    initializeContract() {
        try {
            // Connect to the network
            this.provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
            
            // Connect wallet
            this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            
            // Get contract ABI
            const artifactPath = path.join(__dirname, '../../artifacts/contracts/Event_Ticket.sol/EventTicketS.json');
            const contractArtifact = JSON.parse(fs.readFileSync(artifactPath));
            
            // Create contract instance
            this.contract = new ethers.Contract(
                process.env.CONTRACT_ADDRESS,
                contractArtifact.abi,
                this.wallet
            );
        } catch (error) {
            console.error('Failed to initialize contract:', error);
            throw error;
        }
    }

    async issueTicket(recipientAddress, eventId, eventName, eventTimestamp, eventType) {
        try {
            const tx = await this.contract.issueTicket(
                recipientAddress,
                eventId,
                eventName,
                eventTimestamp,
                eventType
            );
            const receipt = await tx.wait();
            return receipt;
        } catch (error) {
            console.error('Error issuing ticket:', error);
            throw error;
        }
    }

    async verifyTicket(walletAddress, eventId) {
        try {
            const isValid = await this.contract.verifyTicket(walletAddress, eventId);
            if (isValid) {
                const eventDetails = await this.contract.getEventDetails(eventId);
                return {
                    isValid,
                    eventDetails: {
                        name: eventDetails.name,
                        timestamp: eventDetails.timestamp.toString(),
                        eventType: eventDetails.eventType,
                        isActive: eventDetails.isValid
                    }
                };
            }
            return { isValid, eventDetails: null };
        } catch (error) {
            console.error('Error verifying ticket:', error);
            throw error;
        }
    }
}

module.exports = TicketService;