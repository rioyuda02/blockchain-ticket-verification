const { ethers } = require("hardhat");

async function main() {
  try {
    // Deploy the contract first
    console.log("Deploying EventTicketS contract...");
    const EventTicketS = await ethers.getContractFactory("EventTicketS");
    const eventTicket = await EventTicketS.deploy();
    await eventTicket.deployed();
    console.log("Contract:", eventTicket.address);

    // Get signer
    const [owner] = await ethers.getSigners();
    console.log("Using address:", owner.address);

    // Event parameters
    const eventParams = {
      eventId: 1,
      eventName: "Blockchain-Based Event Ticket Verification",
      eventTimestamp: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
      eventType: "running"
    };

    // Wait for a few blocks to ensure contract is properly deployed
    await ethers.provider.send("evm_mine", []);

    console.log("\nIssuing ticket with parameters:");
    console.log(eventParams);

    // Issue ticket
    const issueTx = await eventTicket.issueTicket(
      owner.address,
      eventParams.eventId,
      eventParams.eventName,
      eventParams.eventTimestamp,
      eventParams.eventType,
      { gasLimit: 500000 }
    );
    
    console.log("Waiting for ticket issuance transaction...");
    const receipt = await issueTx.wait();
    console.log(`Transaction successful! Hash: ${receipt.hash}`);

    // Log all events from the transaction
    console.log("\nTransaction events:");
    receipt.events?.forEach((event, index) => {
      console.log(`Event ${index}:`, {
        name: event.event,
        args: event.args
      });
    });

    // Get token ID from Transfer event (ERC721 standard event)
    const transferEvent = receipt.events?.find(e => e.event === "Transfer");
    if (transferEvent) {
      const tokenId = transferEvent.args.tokenId;
      console.log(`\nToken ID from Transfer event: ${tokenId.toString()}`);
    }

    // Verify owner's balance
    const balance = await eventTicket.balanceOf(owner.address);
    console.log(`Owner's ticket balance: ${balance.toString()}`);

    // Try to get event details with explicit error handling
    try {
      console.log("\nFetching event details...");
      const eventDetails = await eventTicket.getEventDetails(eventParams.eventId);
      
      console.log("Event Details:", {
        name: eventDetails.name,
        timestamp: new Date(Number(eventDetails.timestamp) * 1000).toLocaleString(),
        eventType: eventDetails.eventType,
        isValid: eventDetails.isValid
      });
    } catch (error) {
      console.error("Error fetching event details:", error.message);
      
      // Check if the contract exists at the address
      const code = await ethers.provider.getCode(eventTicket.address);
      console.log(`Contract code exists at address: ${code !== "0x"}`);
    }

    // Verify ticket ownership
    try {
      console.log("\nVerifying ticket...");
      const isValid = await eventTicket.verifyTicket(owner.address, eventParams.eventId);
      console.log(`Ticket verification result: ${isValid}`);
    } catch (error) {
      console.error("Error verifying ticket:", error.message);
    }

  } catch (error) {
    console.error("\nScript execution failed:", error);
    
    // Additional error information
    if (error.transaction) {
      console.log("\nTransaction details:");
      console.log("From:", error.transaction.from);
      console.log("To:", error.transaction.to);
      console.log("Data:", error.transaction.data);
    }
    throw error;
  }
}

main()
  .then(() => {
    console.log("\nScript executed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nScript failed!");
    process.exit(1);
  });