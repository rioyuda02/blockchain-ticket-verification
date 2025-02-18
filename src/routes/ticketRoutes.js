const express = require('express');
const { ethers } = require('ethers');
const TicketService = require('../services/ticketService');

const router = express.Router();
const ticketService = new TicketService();

router.post('/issue-ticket', async (req, res) => {
    try {
        const { recipientAddress, eventId, eventName, eventTimestamp, eventType } = req.body;
        
        // Validate input
        if (!recipientAddress || !eventId || !eventName || !eventTimestamp || !eventType) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // Validate Ethereum address
        if (!ethers.utils.isAddress(recipientAddress)) {
            return res.status(400).json({ error: 'Invalid Ethereum address' });
        }

        const receipt = await ticketService.issueTicket(
            recipientAddress,
            eventId,
            eventName,
            eventTimestamp,
            eventType
        );

        res.json({
            success: true,
            transactionHash: receipt.transactionHash
        });
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ 
            error: error.message,
            details: 'Failed to issue ticket. Please check the contract connection and parameters.'
        });
    }
});

router.get('/verify-ticket/:walletAddress/:eventId', async (req, res) => {
    try {
        const { walletAddress, eventId } = req.params;

        // Validate Ethereum address
        if (!ethers.utils.isAddress(walletAddress)) {
            return res.status(400).json({ error: 'Invalid Ethereum address' });
        }

        const verificationResult = await ticketService.verifyTicket(walletAddress, eventId);
        res.json(verificationResult);
    } catch (error) {
        console.error('Route error:', error);
        res.status(500).json({ 
            error: error.message,
            details: 'Failed to verify ticket. Please check the parameters and try again.'
        });
    }
});

module.exports = router;