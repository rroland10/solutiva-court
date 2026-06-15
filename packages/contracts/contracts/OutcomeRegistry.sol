// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Anchors off-chain jury outcomes on Base for auditability
contract OutcomeRegistry is Ownable {
    struct Record {
        bytes32 outcomeHash;
        uint8 outcome;
        uint256 anchoredAt;
        bool exists;
    }

    mapping(address => bool) public relayers;
    mapping(bytes32 => Record) public records;

    event OutcomeAnchored(
        bytes32 indexed disputeKey,
        bytes32 outcomeHash,
        uint8 outcome,
        uint256 anchoredAt
    );
    event RelayerUpdated(address indexed account, bool enabled);

    error OnlyRelayer();
    error AlreadyAnchored();

    modifier onlyRelayer() {
        if (!relayers[msg.sender] && msg.sender != owner()) revert OnlyRelayer();
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        relayers[initialOwner] = true;
    }

    function setRelayer(address account, bool enabled) external onlyOwner {
        relayers[account] = enabled;
        emit RelayerUpdated(account, enabled);
    }

    function anchor(
        bytes32 disputeKey,
        bytes32 outcomeHash,
        uint8 outcome
    ) external onlyRelayer {
        if (records[disputeKey].exists) revert AlreadyAnchored();
        records[disputeKey] = Record({
            outcomeHash: outcomeHash,
            outcome: outcome,
            anchoredAt: block.timestamp,
            exists: true
        });
        emit OutcomeAnchored(disputeKey, outcomeHash, outcome, block.timestamp);
    }
}
