// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title USDT Token — Stablecoin for QsnDEX
/// @notice ERC20 with 6 decimals, burnable, permit
contract TestUSDT is ERC20, ERC20Burnable, ERC20Permit, Ownable {
    uint8 private constant _DECIMALS = 6;
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10 ** _DECIMALS; // 1 billion

    error ExceedsMaxSupply(uint256 requested, uint256 available);

    constructor(address initialOwner)
        ERC20("Tether USD", "USDT")
        ERC20Permit("Tether USD")
        Ownable(initialOwner)
    {
        _mint(initialOwner, 1_000_000 * 10 ** _DECIMALS);
    }

    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        if (totalSupply() + amount > MAX_SUPPLY) {
            revert ExceedsMaxSupply(amount, MAX_SUPPLY - totalSupply());
        }
        _mint(to, amount);
    }
}
