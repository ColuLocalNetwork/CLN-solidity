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
    address public stakeholdersPoolAddress;
    address public unallocatedTokensPoolAddress;
    address public trusteeManagerAddress;

    // Test token decimals.
    // Using same decimal value as ETH (makes ETH-TEST conversion much easier).
    // This is the same as in Test token contract.
    uint256 public constant TOKEN_DECIMALS = 10 ** 18;

    // Maximum number of tokens in circulation: 1.5 trillion.
    uint256 public constant MAX_TOKENS = 15 * 10 ** 8 * TOKEN_DECIMALS;

    // Maximum tokens offered in the sale (45%).
    uint256 public constant MAX_TOKENS_SOLD = 675 * 10 ** 6 * TOKEN_DECIMALS;

    // Maximum tokens offered in the presale (from the initial 45% offered tokens).
    uint256 public constant MAX_PRESALE_TOKENS_SOLD = 3375 * 10 ** 5 * TOKEN_DECIMALS;

    // Tokens allocated for Community pool (25%).
    uint256 public constant COMMUNITY_POOL = 375 * 10 ** 6 * TOKEN_DECIMALS;

    // Tokens allocated for Future development pool (25%).
    uint256 public constant FUTURE_DEVELOPMENT_POOL = 375 * 10 ** 6 * TOKEN_DECIMALS;

    // Tokens allocated for Stakeholders pool (5%).
    uint256 public constant STAKEHOLDERS_POOL = 75 * 10 ** 6 * TOKEN_DECIMALS;

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
    uint256 public constant TIER_1_CAP = 100 * TOKEN_DECIMALS;
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
        uint8 discountPercent;
    }

    VestingPlan[] public vestingPlans = [
        VestingPlan(0, 0, 6 months, 1 months, 4),
        VestingPlan(0, 0, 1 years, 1 months, 12),
        VestingPlan(0, 0, 2 years, 1 months, 26),
        VestingPlan(0, 0, 3 years, 1 months, 35)
    ];

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
    /// @param _stakeHoldersPoolAddress address The address of the stakeholders pool.
    /// @param _unallocatedTokensPoolAddress address The address of the unallocated tokens pool.
    /// @param _trusteeManagerAddress address The address trustee manager.
    /// @param _startTime uint256 The start time of the token sale.
    function TestTokenSale(address _fundingRecipient,
        address _communityPoolAddress,
        address _futureDevelopmentPoolAddress,
        address _stakeholdersPoolAddress,
        address _unallocatedTokensPoolAddress,
        address _trusteeManagerAddress,
        uint256 _startTime) {
        require(_fundingRecipient != address(0));
        require(_communityPoolAddress != address(0));
        require(_futureDevelopmentPoolAddress != address(0));
        require(_stakeholdersPoolAddress != address(0));
        require(_unallocatedTokensPoolAddress != address(0));
        require(_trusteeManagerAddress != address(0));
        require(_startTime > now);

        // Deploy new TestToken contract.
        test = new TestToken(MAX_TOKENS);

        // Deploy new VestingTrustee contract.
        trustee = new VestingTrustee(test);

        fundingRecipient = _fundingRecipient;
        communityPoolAddress = _communityPoolAddress;
        futureDevelopmentPoolAddress = _futureDevelopmentPoolAddress;
        stakeholdersPoolAddress = _stakeholdersPoolAddress;
        startTime = _startTime;
        endTime = startTime + SALE_DURATION;

        // Initialize special vesting grants.
        allocatePoolsTokens();
    }

    /// @dev allocate pools tokens.
    function allocatePoolsTokens() private onlyOwner {
        // Issue the remaining 55% token to designated pools.
        test.ownerTransfer(communityPoolAddress, COMMUNITY_POOL);
        test.ownerTransfer(futureDevelopmentPoolAddress, FUTURE_DEVELOPMENT_POOL);
        test.ownerTransfer(stakeholdersPoolAddress, STAKEHOLDERS_POOL);
    }

    /// @dev Allocate tokens to presale participant according to its vesting plan and invesment value.
    /// @param _recipient address The presale participant address to recieve the tokens.
    /// @param _etherValue uint256 The invesment value as if it was sent in ethers.
    /// @param _vestingPlanIndex uint8 The vesting plan index.
    function presaleAlocation(address _recipient, uint256 _etherValue, uint8 _vestingPlanIndex) public onlyOwner onlyBeforeSale {
        require(_recipient != address(0));
        require(_vestingPlanIndex < vestingPlans.length);

        VestingPlan memory plan = vestingPlans[_vestingPlanIndex]; 
        uint256 discountedTokensPerEth = TTT_PER_ETH.mul(100.sub(plan.discountPercent)).div(100);
        // Accept funds and transfer to funding recipient.
        uint256 tokensLeftInPreSale = MAX_PRESALE_TOKENS_SOLD.sub(presaleTokensSold);
        uint256 weiLeftInSale = tokensLeftInPreSale.div(discountedTokensPerEth);
        uint256 weiToParticipate = SafeMath.min256(_etherValue, weiLeftInSale);
        require(weiToParticipate > 0);
        participationPresaleHistory[msg.sender] = participationPresaleHistory[msg.sender].add(weiToParticipate);
        uint256 tokenSold = weiToParticipate.mul(discountedTokensPerEth);

        issueTokens(trustee, tokenSold);
        trustee.grant(_recipient, tokenSold, now.add(plan.startOffset), now.add(plan.cliffOffset),
            now.add(plan.endOffset), plan.installmentLength, false);
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
        uint256 tokensToIssue = weiToParticipate.mul(TTT_PER_ETH);
        if (tokensLeftInSale.sub(tokensToIssue) < TTT_PER_ETH) {
            // If purchase would cause less than TTT_PER_ETH tokens left then nobody could ever buy them.
            // So, gift them to the last buyer.
            tokensToIssue = tokensLeftInSale;
        }
        tokensSold = tokensSold.add(tokensToIssue);
        issueTokens(_recipient, tokensToIssue);

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
        if (tokensLeftInSale > 0) {
            issueTokens(unallocatedTokensPoolAddress, tokensLeftInSale);
        }

        // transfer ownership of the trustee to the trusteeManagerAddress
        self.requestVestingTrusteeOwnershipTransfer(trusteeManagerAddress);

        // Finish minting.
        test.makeTokensTransferable();
    }

    /// @dev Issues tokens for the recipient.
    /// @param _recipient address The address of the recipient.
    /// @param _tokens uint256 The amount of tokens to issue.
    function issueTokens(address _recipient, uint256 _tokens) private {
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
    ///      the Test token contract can issue new tokens.
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
    ///   1. The new owner will need to call VestingTrustee's acceptOwnership directly in order to accept the ownership.
    ///   2. Calling this method during the token sale will prevent the token sale from finalizaing, since only the owner
    ///      of the VestingTrustee contract can issue new token grants.
    function requestVestingTrusteeOwnershipTransfer(address _newOwnerCandidate) external onlyOwner {
        trustee.requestOwnershipTransfer(_newOwnerCandidate);
    }

    /// @dev Accepts new ownership on behalf of the VestingTrustee contract.
    /// This can be used by the token sale contract itself to claim back ownership of the VestingTrustee contract.
    function acceptVestingTrusteeOwnership() external onlyOwner {
        trustee.acceptOwnership();
    }
}