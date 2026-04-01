// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/// @title QSN Token — Native governance and utility token for QsnDEX
/// @notice ERC20 with burn, permit (gasless approvals), and on-chain voting
contract QsnToken is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, Ownable {
    /// @notice Absolute maximum supply: 100 million QSN
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18;

    error ExceedsMaxSupply(uint256 requested, uint256 available);

    /// @param initialOwner Address that receives ownership and minting rights
    constructor(address initialOwner)
        ERC20("QsnDEX", "QSN")
        ERC20Permit("QsnDEX")
        Ownable(initialOwner)
    {}

    /// @notice Mint new QSN tokens (owner only, respects MAX_SUPPLY)
    /// @param to    Recipient of the minted tokens
    /// @param amount Number of tokens (18-decimal wei)
    function mint(address to, uint256 amount) external onlyOwner {
        if (totalSupply() + amount > MAX_SUPPLY) {
            revert ExceedsMaxSupply(amount, MAX_SUPPLY - totalSupply());
        }
        _mint(to, amount);
    }

    // ───── Required overrides for diamond inheritance ─────

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner_)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner_);
    }
}
