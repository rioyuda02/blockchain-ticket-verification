// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract EventTicketS is ERC721Enumerable, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Events
    event TicketIssued(address indexed recipient, uint256 indexed tokenId, uint256 indexed eventId);
    event EventInvalidated(uint256 indexed eventId);

    // Mapping from token ID to event ID
    mapping(uint256 => uint256) private _ticketEventIds;
    
    // Mapping from event ID to event details
    mapping(uint256 => EventDetails) private _eventDetails;

    struct EventDetails {
        string name;
        uint256 timestamp;
        string eventType;
        bool isValid;
    }

    constructor() ERC721("EventTicketS", "ETS") {}

    modifier eventExists(uint256 eventId) {
        require(_eventDetails[eventId].isValid, "Event does not exist or is invalid");
        _;
    }

    function issueTicket(
        address recipient,
        uint256 eventId,
        string memory eventName,
        uint256 eventTimestamp,
        string memory eventType
    ) public onlyOwner returns (uint256) {
        require(bytes(eventName).length > 0, "Event name cannot be empty");
        require(eventTimestamp > block.timestamp, "Event must be in the future");
        require(recipient != address(0), "Invalid recipient address");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _mint(recipient, newTokenId);
        _ticketEventIds[newTokenId] = eventId;
        _eventDetails[eventId] = EventDetails(
            eventName,
            eventTimestamp,
            eventType,
            true
        );

        emit TicketIssued(recipient, newTokenId, eventId);
        return newTokenId;
    }

    function verifyTicket(address holder, uint256 eventId) 
        public view eventExists(eventId) 
        returns (bool) 
    {
        uint256 balance = balanceOf(holder);
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(holder, i);
            if (_ticketEventIds[tokenId] == eventId) {
                return true;
            }
        }
        return false;
    }

    function getEventDetails(uint256 eventId) 
        public view eventExists(eventId) 
        returns (EventDetails memory) 
    {
        return _eventDetails[eventId];
    }

    function invalidateEvent(uint256 eventId) 
        public onlyOwner eventExists(eventId) 
    {
        _eventDetails[eventId].isValid = false;
        emit EventInvalidated(eventId);
    }
}