// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./QsnERC20.sol";
import "../interfaces/IQsnPair.sol";
import "../interfaces/IQsnFactory.sol";
import "../interfaces/IERC20.sol";

/// @title Qsn Pair — AMM Pool (Constant Product + StableSwap)
/// @notice Core liquidity pool contract supporting multiple fee tiers and pool types
/// @dev SECURITY NOTE (ERC777 / callback tokens): The `lock` modifier prevents same-pair
///      reentrancy. The swap() function verifies the constant-product (or StableSwap)
///      invariant AFTER all external token transfers and optional flash-swap callbacks,
///      ensuring that the pool's final state is always consistent regardless of intermediate
///      callbacks. Cross-pair reentrancy is not exploitable because each pair independently
///      enforces its own invariant. This is an ACKNOWLEDGED design consideration.
contract QsnPair is QsnERC20, IQsnPair {
    uint256 public constant MINIMUM_LIQUIDITY = 1000;

    address public factory;
    address public token0;
    address public token1;
    uint24 public fee; // in hundredths of a bip (100 = 0.01%, 500 = 0.05%, 3000 = 0.30%, 10000 = 1.00%)

    // 0 = CONSTANT_PRODUCT, 1 = STABLE_SWAP
    uint8 public poolType;

    uint112 private reserve0;
    uint112 private reserve1;
    uint32 private blockTimestampLast;

    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;
    uint256 public kLast;

    // StableSwap amplification coefficient (A parameter)
    uint256 public constant STABLE_SWAP_A = 85;
    uint256 private constant STABLE_SWAP_A_PRECISION = 100;
    uint256 private constant STABLE_SWAP_MAX_LOOP = 255;

    // Reentrancy lock
    uint256 private unlocked = 1;
    modifier lock() {
        require(unlocked == 1, "QsnPair: LOCKED");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    constructor() {
        factory = msg.sender;
    }

    /// @notice Called once by the factory at time of deployment
    function initialize(address _token0, address _token1, uint24 _fee, uint8 _poolType) external {
        require(msg.sender == factory, "QsnPair: FORBIDDEN");
        token0 = _token0;
        token1 = _token1;
        fee = _fee;
        poolType = _poolType;
    }

    function getReserves() public view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast) {
        _reserve0 = reserve0;
        _reserve1 = reserve1;
        _blockTimestampLast = blockTimestampLast;
    }

    function _safeTransfer(address token, address to, uint256 value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transfer.selector, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "QsnPair: TRANSFER_FAILED");
    }

    /// @notice Update reserves and price accumulators (TWAP oracle)
    function _update(uint256 balance0, uint256 balance1, uint112 _reserve0, uint112 _reserve1) private {
        require(balance0 <= type(uint112).max && balance1 <= type(uint112).max, "QsnPair: OVERFLOW");
        uint32 blockTimestamp = uint32(block.timestamp % 2 ** 32);
        unchecked {
            uint32 timeElapsed = blockTimestamp - blockTimestampLast;
            if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
                // UQ112x112 price accumulators for TWAP
                price0CumulativeLast += uint256((uint224(_reserve1) << 112) / _reserve0) * timeElapsed;
                price1CumulativeLast += uint256((uint224(_reserve0) << 112) / _reserve1) * timeElapsed;
            }
        }
        reserve0 = uint112(balance0);
        reserve1 = uint112(balance1);
        blockTimestampLast = blockTimestamp;
        emit Sync(uint112(balance0), uint112(balance1));
    }

    /// @notice Mint protocol fee if feeTo is set
    /// @return feeOn Whether protocol fee is active
    function _mintFee(uint112 _reserve0, uint112 _reserve1) private returns (bool feeOn) {
        address feeTo = IQsnFactory(factory).feeTo();
        feeOn = feeTo != address(0);
        uint256 _kLast = kLast;
        if (feeOn) {
            if (_kLast != 0) {
                uint256 rootK = _sqrt(uint256(_reserve0) * uint256(_reserve1));
                uint256 rootKLast = _sqrt(_kLast);
                if (rootK > rootKLast) {
                    uint256 numerator = totalSupply * (rootK - rootKLast);
                    // Protocol takes 1/6 of the 0.3% fee (= 0.05%)
                    uint256 denominator = rootK * 5 + rootKLast;
                    uint256 liquidity = numerator / denominator;
                    if (liquidity > 0) _mint(feeTo, liquidity);
                }
            }
        } else if (_kLast != 0) {
            kLast = 0;
        }
    }

    /// @notice Add liquidity and mint LP tokens
    function mint(address to) external lock returns (uint256 liquidity) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        uint256 balance0 = IERC20(token0).balanceOf(address(this));
        uint256 balance1 = IERC20(token1).balanceOf(address(this));
        uint256 amount0 = balance0 - _reserve0;
        uint256 amount1 = balance1 - _reserve1;

        bool feeOn = _mintFee(_reserve0, _reserve1);
        uint256 _totalSupply = totalSupply;

        if (_totalSupply == 0) {
            liquidity = _sqrt(amount0 * amount1) - MINIMUM_LIQUIDITY;
            _mint(address(0), MINIMUM_LIQUIDITY); // permanently lock minimum liquidity
        } else {
            liquidity = _min(
                (amount0 * _totalSupply) / _reserve0,
                (amount1 * _totalSupply) / _reserve1
            );
        }

        require(liquidity > 0, "QsnPair: INSUFFICIENT_LIQUIDITY_MINTED");
        _mint(to, liquidity);

        _update(balance0, balance1, _reserve0, _reserve1);
        if (feeOn) kLast = uint256(reserve0) * uint256(reserve1);
        emit Mint(msg.sender, amount0, amount1);
    }

    /// @notice Remove liquidity and burn LP tokens
    function burn(address to) external lock returns (uint256 amount0, uint256 amount1) {
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        address _token0 = token0;
        address _token1 = token1;
        uint256 balance0 = IERC20(_token0).balanceOf(address(this));
        uint256 balance1 = IERC20(_token1).balanceOf(address(this));
        uint256 liquidity = balanceOf[address(this)];

        bool feeOn = _mintFee(_reserve0, _reserve1);
        uint256 _totalSupply = totalSupply;

        amount0 = (liquidity * balance0) / _totalSupply;
        amount1 = (liquidity * balance1) / _totalSupply;
        require(amount0 > 0 && amount1 > 0, "QsnPair: INSUFFICIENT_LIQUIDITY_BURNED");

        _burn(address(this), liquidity);
        _safeTransfer(_token0, to, amount0);
        _safeTransfer(_token1, to, amount1);

        balance0 = IERC20(_token0).balanceOf(address(this));
        balance1 = IERC20(_token1).balanceOf(address(this));

        _update(balance0, balance1, _reserve0, _reserve1);
        if (feeOn) kLast = uint256(reserve0) * uint256(reserve1);
        emit Burn(msg.sender, amount0, amount1, to);
    }

    /// @notice Execute a swap with optional flash swap callback
    function swap(uint256 amount0Out, uint256 amount1Out, address to, bytes calldata data) external lock {
        require(amount0Out > 0 || amount1Out > 0, "QsnPair: INSUFFICIENT_OUTPUT_AMOUNT");
        (uint112 _reserve0, uint112 _reserve1,) = getReserves();
        require(amount0Out < _reserve0 && amount1Out < _reserve1, "QsnPair: INSUFFICIENT_LIQUIDITY");

        uint256 balance0;
        uint256 balance1;
        {
            address _token0 = token0;
            address _token1 = token1;
            require(to != _token0 && to != _token1, "QsnPair: INVALID_TO");

            // Optimistic transfer
            if (amount0Out > 0) _safeTransfer(_token0, to, amount0Out);
            if (amount1Out > 0) _safeTransfer(_token1, to, amount1Out);

            // Flash swap callback
            if (data.length > 0) {
                IFlashSwapCallee(to).qsnCall(msg.sender, amount0Out, amount1Out, data);
            }

            balance0 = IERC20(_token0).balanceOf(address(this));
            balance1 = IERC20(_token1).balanceOf(address(this));
        }

        uint256 amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
        uint256 amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
        require(amount0In > 0 || amount1In > 0, "QsnPair: INSUFFICIENT_INPUT_AMOUNT");

        // Verify invariant with fee
        if (poolType == 0) {
            // Constant Product: x * y = k (with fee deducted)
            _verifyConstantProductInvariant(balance0, balance1, _reserve0, _reserve1, amount0In, amount1In);
        } else {
            // StableSwap: verify using curve invariant (with fee deduction)
            _verifyStableSwapInvariant(balance0, balance1, _reserve0, _reserve1, amount0In, amount1In);
        }

        _update(balance0, balance1, _reserve0, _reserve1);
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
    }

    function _verifyConstantProductInvariant(
        uint256 balance0,
        uint256 balance1,
        uint112 _reserve0,
        uint112 _reserve1,
        uint256 amount0In,
        uint256 amount1In
    ) private view {
        uint256 feeDenom = 1_000_000;
        uint256 balance0Adjusted = balance0 * feeDenom - amount0In * fee;
        uint256 balance1Adjusted = balance1 * feeDenom - amount1In * fee;
        // Use mulDiv to avoid overflow: check balance0Adjusted * balance1Adjusted >= reserveProduct * feeDenom^2
        // Rearrange to: balance0Adjusted / feeDenom * balance1Adjusted >= reserveProduct * feeDenom
        // But that loses precision. Instead use: a*b >= c*d  <=>  a >= c*d / b (when b > 0)
        uint256 reserveProduct = uint256(_reserve0) * uint256(_reserve1);
        uint256 feeSquared = feeDenom * feeDenom; // 1e12, safe
        // Check: balance0Adjusted * balance1Adjusted >= reserveProduct * feeSquared
        // Rearrange to avoid overflow: balance0Adjusted >= (reserveProduct * feeSquared + balance1Adjusted - 1) / balance1Adjusted
        // i.e., balance0Adjusted >= ceil(reserveProduct * feeSquared / balance1Adjusted)
        require(balance1Adjusted > 0, "QsnPair: K_INVARIANT_FAILED");
        // reserveProduct (max ~2^224) * feeSquared (1e12 < 2^40) = max ~2^264, can overflow
        // So use: reserveProduct / balance1Adjusted * feeSquared <= balance0Adjusted
        // with remainder check for precision
        uint256 quotient = reserveProduct / balance1Adjusted;
        uint256 remainder = reserveProduct % balance1Adjusted;
        // full result = quotient * feeSquared + remainder * feeSquared / balance1Adjusted
        // We need: balance0Adjusted >= quotient * feeSquared + ceil(remainder * feeSquared / balance1Adjusted)
        uint256 mainPart = quotient * feeSquared;
        uint256 remainderPart = (remainder * feeSquared + balance1Adjusted - 1) / balance1Adjusted;
        require(
            balance0Adjusted >= mainPart + remainderPart,
            "QsnPair: K_INVARIANT_FAILED"
        );
    }

    function _verifyStableSwapInvariant(
        uint256 balance0,
        uint256 balance1,
        uint112 _reserve0,
        uint112 _reserve1,
        uint256 amount0In,
        uint256 amount1In
    ) private view {
        // Apply fee deduction to balances before computing dNew (same logic as constant product)
        uint256 feeDenom = 1_000_000;
        uint256 balance0Adjusted = balance0 * feeDenom - amount0In * fee;
        uint256 balance1Adjusted = balance1 * feeDenom - amount1In * fee;
        uint256 dNew = _computeStableD(balance0Adjusted, balance1Adjusted);
        uint256 dOld = _computeStableD(uint256(_reserve0) * feeDenom, uint256(_reserve1) * feeDenom);
        require(dNew >= dOld, "QsnPair: STABLE_INVARIANT_FAILED");
    }

    /// @notice Compute the StableSwap D invariant
    /// @dev An^n * sum(x_i) + D = ADn^n + D^(n+1) / (n^n * prod(x_i))
    ///      Reserves are capped at uint128.max to prevent overflow in Newton's iteration.
    function _computeStableD(uint256 x0, uint256 x1) private pure returns (uint256 d) {
        uint256 s = x0 + x1;
        if (s == 0) return 0;
        require(x0 > 0 && x1 > 0, "QsnPair: ZERO_RESERVE");
        require(x0 <= type(uint128).max && x1 <= type(uint128).max, "QsnPair: STABLE_RESERVES_TOO_LARGE");

        uint256 prevD;
        d = s;
        uint256 ann = STABLE_SWAP_A * 2; // A * n^n where n=2

        for (uint256 i = 0; i < STABLE_SWAP_MAX_LOOP; i++) {
            uint256 dP = d;
            dP = (dP * d) / (x0 * 2);
            dP = (dP * d) / (x1 * 2);

            prevD = d;
            uint256 numerator = (ann * s / STABLE_SWAP_A_PRECISION + dP * 2) * d;
            uint256 denominator = ((ann - STABLE_SWAP_A_PRECISION) * d / STABLE_SWAP_A_PRECISION + (2 + 1) * dP);
            d = numerator / denominator;

            if (_absDiff(d, prevD) <= 1) {
                return d;
            }
        }
        revert("QsnPair: STABLE_D_NOT_CONVERGED");
    }

    /// @notice Force reserves to match balances — restricted to feeTo address
    function skim(address to) external lock {
        address _feeTo = IQsnFactory(factory).feeTo();
        require(
            to == _feeTo || msg.sender == _feeTo,
            "QsnPair: FORBIDDEN_SKIM"
        );
        address _token0 = token0;
        address _token1 = token1;
        _safeTransfer(_token0, to, IERC20(_token0).balanceOf(address(this)) - reserve0);
        _safeTransfer(_token1, to, IERC20(_token1).balanceOf(address(this)) - reserve1);
    }

    /// @notice Force reserves to match actual token balances
    /// @dev SECURITY NOTE (donation attack): sync() is intentionally unrestricted to allow
    ///      recovery after accidental token transfers. A donation attack via sync() can
    ///      manipulate reserves but is economically irrational: the attacker donates real
    ///      tokens and can only extract value via a subsequent swap that is subject to the
    ///      constant-product invariant. The MINIMUM_LIQUIDITY lock (1000 wei permanently
    ///      locked on first mint) provides a baseline defense against first-depositor
    ///      manipulation. This is an ACKNOWLEDGED design decision consistent with standard
    ///      AMM architecture.
    function sync() external lock {
        _update(
            IERC20(token0).balanceOf(address(this)),
            IERC20(token1).balanceOf(address(this)),
            reserve0,
            reserve1
        );
    }

    // --- Math helpers ---

    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint256 a, uint256 b) private pure returns (uint256) {
        return a < b ? a : b;
    }

    function _absDiff(uint256 a, uint256 b) private pure returns (uint256) {
        return a > b ? a - b : b - a;
    }
}

/// @notice Interface for flash swap callbacks
interface IFlashSwapCallee {
    function qsnCall(address sender, uint256 amount0, uint256 amount1, bytes calldata data) external;
}
