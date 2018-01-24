pragma solidity 0.4.18;

import './ERC20.sol';
import './MarketMaker.sol';

/// @title Ellipse Market Maker Interfase
/// @author Tal Beja
contract IEllipseMarketMaker is MarketMaker {
    
    // precision for price representation (as in ether or tokens).
    uint8 public constant decimals = 18;
    uint256 public constant precision = 18 ** decimals;

    // The tokens pair.
    ERC20 public token1;
    ERC20 public token2;

    // The tokens reserves.
    uint256 public R1;
    uint256 public R2;

    // The tokens full suplly.
    uint256 public S1;
    uint256 public S2;

    // State flags.
    bool public operational;
    bool public openForPublic;

    // Library contract address.
    address public mmLib;

    function supportsToken(address token) public constant returns (bool);

    function calcReserve(uint256 _R1, uint256 _S1, uint256 _S2) public pure returns (uint256);

    function validateReserves() public constant returns (bool);

    function withdrawExcessReserves() public returns (uint256);

    function initializeAfterTransfer() public returns (bool);

    function initializeOnTransfer() public returns (bool);
}
