// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IERC223Receiver {
    function tokenFallback(address from, uint256 value, bytes calldata data) external;
}

/// @title AVF — jury reward and collateral token (ERC-223 compatible)
contract AVF is Ownable {
    string public constant name = "AVF";
    string public constant symbol = "AVF";
    uint8 public constant decimals = 18;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public minters;

    event Transfer(address indexed from, address indexed to, uint256 value, bytes data);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event MinterUpdated(address indexed account, bool enabled);

    error ZeroAddress();
    error InsufficientBalance();
    error InsufficientAllowance();
    error UnauthorizedMinter();

    modifier onlyMinter() {
        if (!minters[msg.sender] && msg.sender != owner()) revert UnauthorizedMinter();
        _;
    }

    constructor(address initialOwner) Ownable(initialOwner) {
        minters[initialOwner] = true;
    }

    function setMinter(address account, bool enabled) external onlyOwner {
        minters[account] = enabled;
        emit MinterUpdated(account, enabled);
    }

    function mint(address to, uint256 amount) external onlyMinter {
        if (to == address(0)) revert ZeroAddress();
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount, new bytes(0));
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value, new bytes(0));
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < value) revert InsufficientAllowance();
            allowance[from][msg.sender] = allowed - value;
        }
        _transfer(from, to, value, new bytes(0));
        return true;
    }

    function transfer(
        address to,
        uint256 value,
        bytes calldata data
    ) public returns (bool) {
        _transfer(msg.sender, to, value, data);
        return true;
    }

    function _transfer(
        address from,
        address to,
        uint256 value,
        bytes memory data
    ) internal {
        if (to == address(0)) revert ZeroAddress();
        if (balanceOf[from] < value) revert InsufficientBalance();

        balanceOf[from] -= value;

        if (to.code.length > 0) {
            balanceOf[to] += value;
            IERC223Receiver(to).tokenFallback(from, value, data);
        } else {
            balanceOf[to] += value;
        }

        emit Transfer(from, to, value, data);
    }
}
