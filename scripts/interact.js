const { ethers } = require("hardhat");

async function main() {
  // Get the contract instance
  const EventTicket = await ethers.getContractFactory("EventTicketS");
  //Contract Address = "Replace with the contract address"
  const eventTicket = await EventTicket.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

  // Create an event
  const eventId = 1;
  const eventName = "Blockchain-Based Event Ticket Verification";
  const eventTimestamp = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now
  const eventType = "running";

  // Get a signer (account) to send transactions
  const [owner] = await ethers.getSigners();

  // Issue a ticket
  const tx = await eventTicket.issueTicket(
    owner.address,
    eventId,
    eventName,
    eventTimestamp,
    eventType
  );
  await tx.wait();

  // Get event details
  const eventDetails = await eventTicket.getEventDetails(eventId);
  console.log("Event Details:", {
    name: eventDetails.name,
    timestamp: eventDetails.timestamp,
    eventType: eventDetails.eventType,
    isValid: eventDetails.isValid
  });

  // Verify ticket
  const isValid = await eventTicket.verifyTicket(owner.address, eventId);
  console.log("Ticket verification:", isValid);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });