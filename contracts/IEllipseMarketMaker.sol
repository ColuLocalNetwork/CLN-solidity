pragma solidity 0.4.18;

import './ERC20.sol';
import './MarketMaker.sol';

contract IEllipseMarketMaker is MarketMaker {
    
    uint256 public constant precision = 2 ** 127;

    ERC20 public token1;
    ERC20 public token2;

    uint256 public R1;
    uint256 public R2;

    uint256 public S1;
    uint256 public S2;

    bool public operational;
    bool public bootstrap;

    address public mmLib;

    function supportsToken(address token) public constant returns (bool);

    function calcReserve(uint256 _R1, uint256 _S1, uint256 _S2) public pure returns (uint256);

    function validateReserves() public constant returns (bool);

    function withdrawExcessReserves() public returns (uint256);

    function endBootstrap() public returns (bool);

    function initializeAfterTransfer() public returns (bool);

    function initializeOnTransfer() public returns (bool);

}
