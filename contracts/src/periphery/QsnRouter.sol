// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IQsnFactory.sol";
import "../interfaces/IQsnPair.sol";
import "../interfaces/IQsnERC20.sol";
import "../interfaces/IERC20.sol";
import "../interfaces/IWETH.sol";
import "./QsnLibrary.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Qsn Router — Peripheral contract for swaps and liquidity
/// @notice Users interact with this contract, not Pair contracts directly
contract QsnRouter is ReentrancyGuard {
    address public immutable factory;
    address public immutable WETH;

    modifier ensure(uint256 deadline) {
        require(deadline >= block.timestamp, "QsnRouter: EXPIRED");
        _;
    }

    constructor(address _factory, address _WETH) {
        factory = _factory;
        WETH = _WETH;
    }

    receive() external payable {
        assert(msg.sender == WETH); // only accept ETH from WETH contract
    }

    // ========================
    // LIQUIDITY
    // ========================

    function _addLiquidity(
        address tokenA,
        address tokenB,
        uint24 fee,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin
    ) internal returns (uint256 amountA, uint256 amountB) {
        // Create pair if it doesn't exist yet
        if (IQsnFactory(factory).getPair(tokenA, tokenB, fee) == address(0)) {
            IQsnFactory(factory).createPair(tokenA, tokenB, fee);
        }
        (uint256 reserveA, uint256 reserveB) = QsnLibrary.getReserves(factory, tokenA, tokenB, fee);
        if (reserveA == 0 && reserveB == 0) {
            (amountA, amountB) = (amountADesired, amountBDesired);
        } else {
            uint256 amountBOptimal = QsnLibrary.quote(amountADesired, reserveA, reserveB);
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "QsnRouter: INSUFFICIENT_B_AMOUNT");
                (amountA, amountB) = (amountADesired, amountBOptimal);
            } else {
                uint256 amountAOptimal = QsnLibrary.quote(amountBDesired, reserveB, reserveA);
                assert(amountAOptimal <= amountADesired);
                require(amountAOptimal >= amountAMin, "QsnRouter: INSUFFICIENT_A_AMOUNT");
                (amountA, amountB) = (amountAOptimal, amountBDesired);
            }
        }
    }

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint24 fee,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        (amountA, amountB) = _addLiquidity(tokenA, tokenB, fee, amountADesired, amountBDesired, amountAMin, amountBMin);
        address pair = IQsnFactory(factory).getPair(tokenA, tokenB, fee);
        _safeTransferFrom(tokenA, msg.sender, pair, amountA);
        _safeTransferFrom(tokenB, msg.sender, pair, amountB);
        liquidity = IQsnPair(pair).mint(to);
    }

    function addLiquidityETH(
        address token,
        uint24 fee,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable nonReentrant ensure(deadline) returns (uint256 amountToken, uint256 amountETH, uint256 liquidity) {
        (amountToken, amountETH) = _addLiquidity(
            token, WETH, fee, amountTokenDesired, msg.value, amountTokenMin, amountETHMin
        );
        address pair = IQsnFactory(factory).getPair(token, WETH, fee);
        _safeTransferFrom(token, msg.sender, pair, amountToken);
        IWETH(WETH).deposit{value: amountETH}();
        assert(IWETH(WETH).transfer(pair, amountETH));
        liquidity = IQsnPair(pair).mint(to);
        // Refund excess ETH
        if (msg.value > amountETH) {
            (bool success,) = msg.sender.call{value: msg.value - amountETH}("");
            require(success, "QsnRouter: ETH_REFUND_FAILED");
        }
    }

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint24 fee,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) public nonReentrant ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        return _removeLiquidity(tokenA, tokenB, fee, liquidity, amountAMin, amountBMin, to);
    }

    function _removeLiquidity(
        address tokenA,
        address tokenB,
        uint24 fee,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to
    ) internal returns (uint256 amountA, uint256 amountB) {
        address pair = IQsnFactory(factory).getPair(tokenA, tokenB, fee);
        require(pair != address(0), "QsnRouter: PAIR_NOT_FOUND");
        IQsnERC20(pair).transferFrom(msg.sender, pair, liquidity);
        (uint256 amount0, uint256 amount1) = IQsnPair(pair).burn(to);
        (address token0,) = QsnLibrary.sortTokens(tokenA, tokenB);
        (amountA, amountB) = tokenA == token0 ? (amount0, amount1) : (amount1, amount0);
        require(amountA >= amountAMin, "QsnRouter: INSUFFICIENT_A_AMOUNT");
        require(amountB >= amountBMin, "QsnRouter: INSUFFICIENT_B_AMOUNT");
    }

    function removeLiquidityETH(
        address token,
        uint24 fee,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) public nonReentrant ensure(deadline) returns (uint256 amountToken, uint256 amountETH) {
        (amountToken, amountETH) = _removeLiquidity(
            token, WETH, fee, liquidity, amountTokenMin, amountETHMin, address(this)
        );
        _safeTransfer(token, to, amountToken);
        IWETH(WETH).withdraw(amountETH);
        (bool success,) = to.call{value: amountETH}("");
        require(success, "QsnRouter: ETH_TRANSFER_FAILED");
    }

    struct PermitParams {
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    function removeLiquidityETHWithPermit(
        address token,
        uint24 fee,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant ensure(deadline) returns (uint256 amountToken, uint256 amountETH) {
        _permitPair(token, fee, liquidity, deadline, approveMax, PermitParams(v, r, s));
        (amountToken, amountETH) = _removeLiquidity(
            token, WETH, fee, liquidity, amountTokenMin, amountETHMin, address(this)
        );
        _safeTransfer(token, to, amountToken);
        IWETH(WETH).withdraw(amountETH);
        (bool success,) = to.call{value: amountETH}("");
        require(success, "QsnRouter: ETH_TRANSFER_FAILED");
    }

    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint24 fee,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external nonReentrant ensure(deadline) returns (uint256 amountA, uint256 amountB) {
        _permitPairTokens(tokenA, tokenB, fee, liquidity, deadline, approveMax, PermitParams(v, r, s));
        (amountA, amountB) = _removeLiquidity(tokenA, tokenB, fee, liquidity, amountAMin, amountBMin, to);
    }

    function _permitPair(
        address token,
        uint24 fee,
        uint256 liquidity,
        uint256 deadline,
        bool approveMax,
        PermitParams memory p
    ) internal {
        address pair = IQsnFactory(factory).getPair(token, WETH, fee);
        uint256 value = approveMax ? type(uint256).max : liquidity;
        IQsnERC20(pair).permit(msg.sender, address(this), value, deadline, p.v, p.r, p.s);
    }

    function _permitPairTokens(
        address tokenA,
        address tokenB,
        uint24 fee,
        uint256 liquidity,
        uint256 deadline,
        bool approveMax,
        PermitParams memory p
    ) internal {
        address pair = IQsnFactory(factory).getPair(tokenA, tokenB, fee);
        uint256 value = approveMax ? type(uint256).max : liquidity;
        IQsnERC20(pair).permit(msg.sender, address(this), value, deadline, p.v, p.r, p.s);
    }

    // ========================
    // SWAP
    // ========================

    function _swap(uint256[] memory amounts, address[] memory path, uint24[] memory fees, address _to) internal {
        for (uint256 i = 0; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = QsnLibrary.sortTokens(input, output);
            uint256 amountOut = amounts[i + 1];
            (uint256 amount0Out, uint256 amount1Out) = input == token0
                ? (uint256(0), amountOut)
                : (amountOut, uint256(0));
            address to = i < path.length - 2
                ? IQsnFactory(factory).getPair(output, path[i + 2], fees[i + 1])
                : _to;
            IQsnPair(IQsnFactory(factory).getPair(input, output, fees[i])).swap(
                amount0Out, amount1Out, to, new bytes(0)
            );
        }
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        uint24[] calldata fees,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256[] memory amounts) {
        amounts = QsnLibrary.getAmountsOut(factory, amountIn, path, fees);
        require(amounts[amounts.length - 1] >= amountOutMin, "QsnRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        address firstPair = IQsnFactory(factory).getPair(path[0], path[1], fees[0]);
        _safeTransferFrom(path[0], msg.sender, firstPair, amounts[0]);
        _swap(amounts, path, fees, to);
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        uint24[] calldata fees,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256[] memory amounts) {
        amounts = QsnLibrary.getAmountsIn(factory, amountOut, path, fees);
        require(amounts[0] <= amountInMax, "QsnRouter: EXCESSIVE_INPUT_AMOUNT");
        address firstPair = IQsnFactory(factory).getPair(path[0], path[1], fees[0]);
        _safeTransferFrom(path[0], msg.sender, firstPair, amounts[0]);
        _swap(amounts, path, fees, to);
    }

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        uint24[] calldata fees,
        address to,
        uint256 deadline
    ) external payable nonReentrant ensure(deadline) returns (uint256[] memory amounts) {
        require(path[0] == WETH, "QsnRouter: INVALID_PATH");
        amounts = QsnLibrary.getAmountsOut(factory, msg.value, path, fees);
        require(amounts[amounts.length - 1] >= amountOutMin, "QsnRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        IWETH(WETH).deposit{value: amounts[0]}();
        address firstPair = IQsnFactory(factory).getPair(path[0], path[1], fees[0]);
        assert(IWETH(WETH).transfer(firstPair, amounts[0]));
        _swap(amounts, path, fees, to);
    }

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        uint24[] calldata fees,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256[] memory amounts) {
        require(path[path.length - 1] == WETH, "QsnRouter: INVALID_PATH");
        amounts = QsnLibrary.getAmountsIn(factory, amountOut, path, fees);
        require(amounts[0] <= amountInMax, "QsnRouter: EXCESSIVE_INPUT_AMOUNT");
        address firstPair = IQsnFactory(factory).getPair(path[0], path[1], fees[0]);
        _safeTransferFrom(path[0], msg.sender, firstPair, amounts[0]);
        _swap(amounts, path, fees, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        (bool success,) = to.call{value: amounts[amounts.length - 1]}("");
        require(success, "QsnRouter: ETH_TRANSFER_FAILED");
    }

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        uint24[] calldata fees,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) returns (uint256[] memory amounts) {
        require(path[path.length - 1] == WETH, "QsnRouter: INVALID_PATH");
        amounts = QsnLibrary.getAmountsOut(factory, amountIn, path, fees);
        require(amounts[amounts.length - 1] >= amountOutMin, "QsnRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        address firstPair = IQsnFactory(factory).getPair(path[0], path[1], fees[0]);
        _safeTransferFrom(path[0], msg.sender, firstPair, amounts[0]);
        _swap(amounts, path, fees, address(this));
        IWETH(WETH).withdraw(amounts[amounts.length - 1]);
        (bool success,) = to.call{value: amounts[amounts.length - 1]}("");
        require(success, "QsnRouter: ETH_TRANSFER_FAILED");
    }

    function swapETHForExactTokens(
        uint256 amountOut,
        address[] calldata path,
        uint24[] calldata fees,
        address to,
        uint256 deadline
    ) external payable nonReentrant ensure(deadline) returns (uint256[] memory amounts) {
        require(path[0] == WETH, "QsnRouter: INVALID_PATH");
        amounts = QsnLibrary.getAmountsIn(factory, amountOut, path, fees);
        require(amounts[0] <= msg.value, "QsnRouter: EXCESSIVE_INPUT_AMOUNT");
        IWETH(WETH).deposit{value: amounts[0]}();
        address firstPair = IQsnFactory(factory).getPair(path[0], path[1], fees[0]);
        assert(IWETH(WETH).transfer(firstPair, amounts[0]));
        _swap(amounts, path, fees, to);
        // Refund excess ETH
        if (msg.value > amounts[0]) {
            (bool success,) = msg.sender.call{value: msg.value - amounts[0]}("");
            require(success, "QsnRouter: ETH_REFUND_FAILED");
        }
    }

    // ========================
    // FEE-ON-TRANSFER TOKEN SWAPS
    // ========================

    /// @notice Internal swap that measures actual received balances instead of pre-calculated amounts.
    ///         Required for tokens that take a fee on every transfer (e.g. deflationary tokens).
    function _swapSupportingFeeOnTransfer(address[] memory path, uint24[] memory fees, address _to) internal {
        for (uint256 i = 0; i < path.length - 1; i++) {
            (address input, address output) = (path[i], path[i + 1]);
            (address token0,) = QsnLibrary.sortTokens(input, output);
            address pair = IQsnFactory(factory).getPair(input, output, fees[i]);

            uint256 amountInput;
            uint256 amountOutput;
            {
                (uint112 r0, uint112 r1,) = IQsnPair(pair).getReserves();
                (uint256 reserveInput, uint256 reserveOutput) = input == token0
                    ? (uint256(r0), uint256(r1))
                    : (uint256(r1), uint256(r0));
                amountInput = IERC20(input).balanceOf(pair) - reserveInput;
                amountOutput = QsnLibrary.getAmountOut(amountInput, reserveInput, reserveOutput, fees[i]);
            }

            (uint256 amount0Out, uint256 amount1Out) = input == token0
                ? (uint256(0), amountOutput)
                : (amountOutput, uint256(0));
            address to = i < path.length - 2
                ? IQsnFactory(factory).getPair(output, path[i + 2], fees[i + 1])
                : _to;
            IQsnPair(pair).swap(amount0Out, amount1Out, to, new bytes(0));
        }
    }

    /// @notice Swap exact input tokens for output tokens, supporting fee-on-transfer tokens
    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        uint24[] calldata fees,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) {
        require(path.length >= 2, "QsnRouter: INVALID_PATH");
        require(path.length - 1 == fees.length, "QsnRouter: PATH_FEE_MISMATCH");
        address firstPair = IQsnFactory(factory).getPair(path[0], path[1], fees[0]);
        _safeTransferFrom(path[0], msg.sender, firstPair, amountIn);
        uint256 balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        _swapSupportingFeeOnTransfer(path, fees, to);
        require(
            IERC20(path[path.length - 1]).balanceOf(to) - balanceBefore >= amountOutMin,
            "QsnRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
    }

    /// @notice Swap exact ETH for tokens, supporting fee-on-transfer tokens
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint256 amountOutMin,
        address[] calldata path,
        uint24[] calldata fees,
        address to,
        uint256 deadline
    ) external payable nonReentrant ensure(deadline) {
        require(path[0] == WETH, "QsnRouter: INVALID_PATH");
        require(path.length >= 2, "QsnRouter: INVALID_PATH");
        require(path.length - 1 == fees.length, "QsnRouter: PATH_FEE_MISMATCH");
        uint256 amountIn = msg.value;
        IWETH(WETH).deposit{value: amountIn}();
        address firstPair = IQsnFactory(factory).getPair(path[0], path[1], fees[0]);
        assert(IWETH(WETH).transfer(firstPair, amountIn));
        uint256 balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);
        _swapSupportingFeeOnTransfer(path, fees, to);
        require(
            IERC20(path[path.length - 1]).balanceOf(to) - balanceBefore >= amountOutMin,
            "QsnRouter: INSUFFICIENT_OUTPUT_AMOUNT"
        );
    }

    /// @notice Swap exact tokens for ETH, supporting fee-on-transfer tokens
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        uint24[] calldata fees,
        address to,
        uint256 deadline
    ) external nonReentrant ensure(deadline) {
        require(path[path.length - 1] == WETH, "QsnRouter: INVALID_PATH");
        require(path.length >= 2, "QsnRouter: INVALID_PATH");
        require(path.length - 1 == fees.length, "QsnRouter: PATH_FEE_MISMATCH");
        address firstPair = IQsnFactory(factory).getPair(path[0], path[1], fees[0]);
        _safeTransferFrom(path[0], msg.sender, firstPair, amountIn);
        _swapSupportingFeeOnTransfer(path, fees, address(this));
        uint256 amountOut = IERC20(WETH).balanceOf(address(this));
        require(amountOut >= amountOutMin, "QsnRouter: INSUFFICIENT_OUTPUT_AMOUNT");
        IWETH(WETH).withdraw(amountOut);
        (bool success,) = to.call{value: amountOut}("");
        require(success, "QsnRouter: ETH_TRANSFER_FAILED");
    }

    // ========================
    // LIBRARY WRAPPERS
    // ========================

    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) public pure returns (uint256 amountB) {
        return QsnLibrary.quote(amountA, reserveA, reserveB);
    }

    function getAmountOut(uint256 amountIn, uint256 reserveIn, uint256 reserveOut, uint24 fee) public pure returns (uint256 amountOut) {
        return QsnLibrary.getAmountOut(amountIn, reserveIn, reserveOut, fee);
    }

    function getAmountIn(uint256 amountOut, uint256 reserveIn, uint256 reserveOut, uint24 fee) public pure returns (uint256 amountIn) {
        return QsnLibrary.getAmountIn(amountOut, reserveIn, reserveOut, fee);
    }

    function getAmountsOut(uint256 amountIn, address[] calldata path, uint24[] calldata fees) public view returns (uint256[] memory amounts) {
        return QsnLibrary.getAmountsOut(factory, amountIn, path, fees);
    }

    function getAmountsIn(uint256 amountOut, address[] calldata path, uint24[] calldata fees) public view returns (uint256[] memory amounts) {
        return QsnLibrary.getAmountsIn(factory, amountOut, path, fees);
    }

    // ========================
    // HELPERS
    // ========================

    function _safeTransfer(address token, address to, uint256 value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transfer.selector, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "QsnRouter: TRANSFER_FAILED");
    }

    function _safeTransferFrom(address token, address from, address to, uint256 value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "QsnRouter: TRANSFER_FROM_FAILED");
    }
}
