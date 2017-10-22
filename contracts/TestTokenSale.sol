pragma solidity ^0.4.15;

import './SafeMath.sol';
import './Ownable.sol';
import './TokenHolder.sol';
import './TestToken.sol';
import './VestingTrustee.sol';

/// @title Test token sale contract.
contract TestTokenSale is Ownable, TokenHolder {
    using SafeMath for uint256;

    // External parties:

    // TEST token contract.
    TestToken public test;

    // Vesting contract for pre-sale participants.
    VestingTrustee public trustee;

    // Received funds are forwarded to this address.
    address public fundingRecipient;

    // Post-TDE multisig addresses.
    address public communityPoolAddress;
    address public futureDevelopmentPoolAddress;
    address public teamPoolAddress;

    // Test token decimals.
    // Using same decimal value as ETH (makes ETH-TEST conversion much easier).
    // This is the same as in Test token contract.
    uint256 public constant TOKEN_DECIMALS = 10 ** 18;

    // Additional Lockup Allocation Pool 
    uint256 public constant ALAP = 47414230500000023839554600;

    // Maximum number of tokens in circulation: 1.5 trillion.
    uint256 public constant MAX_TOKENS = 15 * 10 ** 8 * TOKEN_DECIMALS + ALAP;

    // Maximum tokens offered in the sale (35%) + ALAP.
    uint256 public constant MAX_TOKENS_SOLD = 525 * 10 ** 6 * TOKEN_DECIMALS + ALAP;

    // Maximum tokens offered in the presale (from the initial 35% offered tokens) + ALAP.
    uint256 public constant MAX_PRESALE_TOKENS_SOLD = 2625 * 10 ** 5 * TOKEN_DECIMALS + ALAP;

    // Tokens allocated for Community pool (30%).
    uint256 public constant COMMUNITY_POOL = 45 * 10 ** 7 * TOKEN_DECIMALS;

    // Tokens allocated for Future development pool (29%).
    uint256 public constant FUTURE_DEVELOPMENT_POOL = 435 * 10 ** 6 * TOKEN_DECIMALS;

    // Tokens allocated for Team pool (6%).
    uint256 public constant TEAM_POOL = 9 * 10 ** 7 * TOKEN_DECIMALS;

    // TEST to ETH ratio.
    uint256 public constant TTT_PER_ETH = 3900;

    // Sale start, end blocks (time ranges)
    uint256 public constant SALE_DURATION = 7 days;
    uint256 public startTime;
    uint256 public endTime;

    // Amount of tokens sold until now in the sale.
    uint256 public tokensSold = 0;

    // Amount of tokens sold until now in the sale.
    uint256 public presaleTokensSold = 0;

    // Participation caps, according to KYC tiers.
    uint256 public constant TIER_1_CAP = 300 * TTT_PER_ETH * TOKEN_DECIMALS;
    uint256 public constant TIER_2_CAP = uint256(-1); // Maximum uint256 value

    // Accumulated amount each participant have contributed so far.
    mapping (address => uint256) public participationHistory;
    
    // Accumulated amount each participant have contributed so far in the presale.
    mapping (address => uint256) public participationPresaleHistory;

    // Maximum amount that each particular is allowed to contribute (in WEI).
    mapping (address => uint256) public participationCaps;

    // Maximum amount ANYBODY is currently allowed to contribute.
    uint256 public hardParticipationCap = 5000 * TOKEN_DECIMALS;

    struct VestingPlan {
        uint256 startOffset;
        uint256 cliffOffset;
        uint256 endOffset;
        uint256 installmentLength;
        uint8 alapPercent;
    }

    VestingPlan[] public vestingPlans;

    event TokensIssued(address indexed _to, uint256 _tokens);

    /// @dev Reverts if called when not before sale.
    modifier onlyBeforeSale() {
        if (now >= startTime) {
            revert();
        }

        _;
    }

    /// @dev Reverts if called when not during sale.
    modifier onlyDuringSale() {
        if (tokensSold >= MAX_TOKENS_SOLD || now < startTime || now >= endTime) {
            revert();
        }

        _;
    }

    /// @dev Reverts if called before sale ends.
    modifier onlyAfterSale() {
        if (!(tokensSold >= MAX_TOKENS_SOLD || now >= endTime)) {
            revert();
        }

        _;
    }

    /// @dev Constructor that initializes the sale conditions.
    /// @param _fundingRecipient address The address of the funding recipient.
    /// @param _communityPoolAddress address The address of the community pool.
    /// @param _futureDevelopmentPoolAddress address The address of the future development pool.
    /// @param _teamPoolAddress address The address of the team pool.
    /// @param _startTime uint256 The start time of the token sale.
    function TestTokenSale(address _fundingRecipient,
        address _communityPoolAddress,
        address _futureDevelopmentPoolAddress,
        address _teamPoolAddress,
        uint256 _startTime) {
        require(_fundingRecipient != address(0));
        require(_communityPoolAddress != address(0));
        require(_futureDevelopmentPoolAddress != address(0));
        require(_teamPoolAddress != address(0));
        require(_startTime > now);

        vestingPlans.push(VestingPlan(0, 0, 1 days, 1 days, 0));
        vestingPlans.push(VestingPlan(0, 0, 6 * 30 days, 1 * 30 days, 4));
        vestingPlans.push(VestingPlan(0, 0, 1 years, 1 * 30 days, 12));
        vestingPlans.push(VestingPlan(0, 0, 2 years, 1 * 30 days, 26));
        vestingPlans.push(VestingPlan(0, 0, 3 years, 1 * 30 days, 35));

        // Deploy new TestToken contract.
        test = new TestToken(MAX_TOKENS);

        // Deploy new VestingTrustee contract.
        trustee = new VestingTrustee(test);

        fundingRecipient = _fundingRecipient;
        communityPoolAddress = _communityPoolAddress;
        futureDevelopmentPoolAddress = _futureDevelopmentPoolAddress;
        teamPoolAddress = _teamPoolAddress;
        startTime = _startTime;
        endTime = startTime + SALE_DURATION;

        // Initialize special vesting grants.
        allocatePoolsTokens();
    }

    /// @dev allocate pools tokens.
    function allocatePoolsTokens() private onlyOwner {
        // Issue the remaining 55% token to designated pools.

        transferTokens(communityPoolAddress, COMMUNITY_POOL);
        
        // teamPoolAddress will create its own vesting trusts.
        transferTokens(teamPoolAddress, TEAM_POOL);
    }

    /// @dev Allocate tokens to presale participant according to its vesting plan and invesment value.
    /// @param _recipient address The presale participant address to recieve the tokens.
    /// @param _etherValue uint256 The invesment value as if it was sent in ethers.
    /// @param _vestingPlanIndex uint8 The vesting plan index.
    function presaleAlocation(address _recipient, uint256 _etherValue, uint8 _vestingPlanIndex) public onlyOwner onlyBeforeSale {
        require(_recipient != address(0));
        require(_vestingPlanIndex < vestingPlans.length);

        VestingPlan memory plan = vestingPlans[_vestingPlanIndex]; 
        uint256 tokensAndALAPPerEth = TTT_PER_ETH.mul(SafeMath.add(100, plan.alapPercent)).div(100);
        // Accept funds and transfer to funding recipient.
        uint256 tokensLeftInPreSale = MAX_PRESALE_TOKENS_SOLD.sub(presaleTokensSold);
        uint256 weiLeftInSale = tokensLeftInPreSale.div(tokensAndALAPPerEth);
        uint256 weiToParticipate = SafeMath.min256(_etherValue, weiLeftInSale);
        require(weiToParticipate > 0);
        participationPresaleHistory[msg.sender] = participationPresaleHistory[msg.sender].add(weiToParticipate);
        uint256 tokensToTransfer = weiToParticipate.mul(tokensAndALAPPerEth);
        presaleTokensSold = presaleTokensSold.add(tokensToTransfer);
        tokensSold = tokensSold.add(tokensToTransfer);
        transferTokens(trustee, tokensToTransfer);
        trustee.grant(_recipient, tokensToTransfer, endTime.add(plan.startOffset), endTime.add(plan.cliffOffset),
            endTime.add(plan.endOffset), plan.installmentLength, false);
    }

    /// @dev Add a list of participants to a capped participation tier.
    /// @param _participants address[] The list of participant addresses.
    /// @param _cap uint256 The cap amount (in ETH).
    function setParticipationCap(address[] _participants, uint256 _cap) private onlyOwner {
        for (uint i = 0; i < _participants.length; i++) {
            participationCaps[_participants[i]] = _cap;
        }
    }

    /// @dev Add a list of participants to cap tier #1.
    /// @param _participants address[] The list of participant addresses.
    function setTier1Participants(address[] _participants) external onlyOwner {
        setParticipationCap(_participants, TIER_1_CAP);
    }

    /// @dev Add a list of participants to tier #2.
    /// @param _participants address[] The list of participant addresses.
    function setTier2Participants(address[] _participants) external onlyOwner {
        setParticipationCap(_participants, TIER_2_CAP);
    }

    /// @dev Set hard participation cap for all participants.
    /// @param _cap uint256 The hard cap amount.
    function setHardParticipationCap(uint256 _cap) external onlyOwner {
        require(_cap > 0);

        hardParticipationCap = _cap;
    }

    /// @dev Fallback function that will delegate the request to create().
    function () external payable onlyDuringSale {
        create(msg.sender);
    }

    /// @dev Create and sell tokens to the caller.
    /// @param _recipient address The address of the recipient receiving the tokens.
    function create(address _recipient) public payable onlyDuringSale {
        require(_recipient != address(0));

        // Enforce participation cap (in Wei received).
        uint256 weiAlreadyParticipated = participationHistory[msg.sender];
        uint256 participationCap = SafeMath.min256(participationCaps[msg.sender], hardParticipationCap);
        uint256 cappedWeiReceived = SafeMath.min256(msg.value, participationCap.sub(weiAlreadyParticipated));
        require(cappedWeiReceived > 0);

        // Accept funds and transfer to funding recipient.
        uint256 tokensLeftInSale = MAX_TOKENS_SOLD.sub(tokensSold);
        uint256 weiLeftInSale = tokensLeftInSale.div(TTT_PER_ETH);
        uint256 weiToParticipate = SafeMath.min256(cappedWeiReceived, weiLeftInSale);
        participationHistory[msg.sender] = weiAlreadyParticipated.add(weiToParticipate);
        fundingRecipient.transfer(weiToParticipate);

        // Issue tokens and transfer to recipient.
        uint256 tokensToTransfer = weiToParticipate.mul(TTT_PER_ETH);
        if (tokensLeftInSale.sub(tokensToTransfer) < TTT_PER_ETH) {
            // If purchase would cause less than TTT_PER_ETH tokens left then nobody could ever buy them.
            // So, gift them to the last buyer.
            tokensToTransfer = tokensLeftInSale;
        }
        tokensSold = tokensSold.add(tokensToTransfer);
        transferTokens(_recipient, tokensToTransfer);

        // Partial refund if full participation not possible
        // e.g. due to cap being reached.
        uint256 refund = msg.value.sub(weiToParticipate);
        if (refund > 0) {
            msg.sender.transfer(refund);
        }
    }

    /// @dev Finalizes the token sale event, by stopping token minting.
    function finalize() external onlyAfterSale onlyOwner {
        if (test.isTransferable()) {
            revert();
        }

        uint256 tokensLeftInSale = MAX_TOKENS_SOLD.sub(tokensSold);
        uint256 futureDevelopmentPool = FUTURE_DEVELOPMENT_POOL.add(tokensLeftInSale);
        // Future Development Pool is locked for 3 years.
        transferTokens(trustee, futureDevelopmentPool);
        trustee.grant(futureDevelopmentPoolAddress, futureDevelopmentPool, endTime, endTime.add(3 years),
            endTime.add(3 years), 1 days, false);

        // Finish minting.
        test.makeTokensTransferable();
    }

    /// @dev Issues tokens for the recipient.
    /// @param _recipient address The address of the recipient.
    /// @param _tokens uint256 The amount of tokens to transfer.
    function transferTokens(address _recipient, uint256 _tokens) private {
        // Request Test token contract to ownerTransfer the requested tokens for the buyer.
        test.ownerTransfer(_recipient, _tokens);

        TokensIssued(_recipient, _tokens);
    }

    /// @dev Requests to transfer control of the Test token contract to a new owner.
    /// @param _newOwnerCandidate address The address to transfer ownership to.
    ///
    /// NOTE:
    ///   1. The new owner will need to call Test token contract's acceptOwnership directly in order to accept the ownership.
    ///   2. Calling this method during the token sale will prevent the token sale to continue, since only the owner of
    ///      the Test token contract can transfer tokens during the sale.
    function requestTestTokenOwnershipTransfer(address _newOwnerCandidate) external onlyOwner {
        test.requestOwnershipTransfer(_newOwnerCandidate);
    }

    /// @dev Accepts new ownership on behalf of the Test token contract.
    // This can be used by the sale contract itself to claim back ownership of the Test token contract.
    function acceptTestTokenOwnership() external onlyOwner {
        test.acceptOwnership();
    }

    /// @dev Requests to transfer control of the VestingTrustee contract to a new owner.
    /// @param _newOwnerCandidate address The address to transfer ownership to.
    ///
    /// NOTE:
    ///   The new owner will need to call VestingTrustee's acceptOwnership directly in order to accept the ownership.
    function requestVestingTrusteeOwnershipTransfer(address _newOwnerCandidate) external onlyOwner {
        trustee.requestOwnershipTransfer(_newOwnerCandidate);
    }

    /// @dev Accepts new ownership on behalf of the VestingTrustee contract.
    /// This can be used by the token sale contract itself to claim back ownership of the VestingTrustee contract.
    function acceptVestingTrusteeOwnership() external onlyOwner {
        trustee.acceptOwnership();
    }
}