// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC223Recipient} from "./IERC223Recipient.sol";

// Holds AVF collateral for off-chain disputes keyed by disputeKey.
// Compatible with EthereumCommonwealth/AVF_Token (tokenReceived hook).
contract DisputeEscrow is Ownable, IERC223Recipient {
    bytes4 private constant TOKEN_RECEIVED_SUCCESS = 0x8943ec02;

    enum Outcome {
        RefundPlaintiff,
        PlaintiffWins,
        DefendantWins
    }

    struct Deposit {
        address plaintiff;
        address defendant;
        uint256 amount;
        bool settled;
    }

    address public immutable avfToken;
    mapping(address => bool) public relayers;
    mapping(bytes32 => Deposit) public deposits;

    event Deposited(
        bytes32 indexed disputeKey,
        address indexed plaintiff,
        address indexed defendant,
        uint256 amount
    );
    event Settled(bytes32 indexed disputeKey, Outcome outcome, address recipient, uint256 amount);
    event RelayerUpdated(address indexed account, bool enabled);

    error OnlyAvfToken();
    error OnlyRelayer();
    error DepositExists();
    error NoDeposit();
    error AlreadySettled();
    error InvalidRecipient();

    modifier onlyRelayer() {
        if (!relayers[msg.sender] && msg.sender != owner()) revert OnlyRelayer();
        _;
    }

    constructor(address avfToken_, address initialOwner) Ownable(initialOwner) {
        avfToken = avfToken_;
        relayers[initialOwner] = true;
    }

    function setRelayer(address account, bool enabled) external onlyOwner {
        relayers[account] = enabled;
        emit RelayerUpdated(account, enabled);
    }

    function tokenReceived(
        address _from,
        uint256 _value,
        bytes memory _data
    ) external override returns (bytes4) {
        if (msg.sender != avfToken) revert OnlyAvfToken();
        (bytes32 disputeKey, address defendant) = abi.decode(_data, (bytes32, address));
        if (deposits[disputeKey].amount != 0) revert DepositExists();

        deposits[disputeKey] = Deposit({
            plaintiff: _from,
            defendant: defendant,
            amount: _value,
            settled: false
        });

        emit Deposited(disputeKey, _from, defendant, _value);
        return TOKEN_RECEIVED_SUCCESS;
    }

    function settle(
        bytes32 disputeKey,
        Outcome outcome,
        address recipient
    ) external onlyRelayer {
        Deposit storage deposit = deposits[disputeKey];
        if (deposit.amount == 0) revert NoDeposit();
        if (deposit.settled) revert AlreadySettled();

        if (outcome == Outcome.RefundPlaintiff) {
            recipient = deposit.plaintiff;
        } else if (outcome == Outcome.PlaintiffWins) {
            recipient = deposit.plaintiff;
        } else if (outcome == Outcome.DefendantWins) {
            recipient = deposit.defendant;
        }

        if (recipient == address(0)) revert InvalidRecipient();

        uint256 amount = deposit.amount;
        deposit.settled = true;
        deposit.amount = 0;

        _transferAvf(recipient, amount);
        emit Settled(disputeKey, outcome, recipient, amount);
    }

    function _transferAvf(address to, uint256 amount) internal {
        (bool ok, bytes memory data) = avfToken.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "AVF transfer failed");
    }
}
