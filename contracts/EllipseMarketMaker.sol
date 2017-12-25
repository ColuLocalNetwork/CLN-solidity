pragma solidity 0.4.18;

import './SafeMath.sol';
import './MarketMaker.sol';
import './ERC223.sol';

contract EllipseMarketMaker is MarketMaker {
    using SafeMath for uint256;

    uint256 public constant precision = 10 ** 6;

    ERC223 public token1;
    ERC223 public token2;

    uint256 public R1;
    uint256 public R2;

    uint256 public S1;
    uint256 public S2;
}