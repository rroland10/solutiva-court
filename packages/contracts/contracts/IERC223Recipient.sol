// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Matches EthereumCommonwealth/AVF_Token ERC-223 recipient interface.
// https://github.com/EthereumCommonwealth/AVF_Token
interface IERC223Recipient {
    function tokenReceived(
        address _from,
        uint256 _value,
        bytes memory _data
    ) external returns (bytes4);
}
