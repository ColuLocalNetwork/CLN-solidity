pragma solidity 0.4.18;

import './SafeMath.sol';
import './Ownable.sol';
import './TokenHolder.sol';
import './ColuLocalNetwork.sol';
import './VestingTrustee.sol';

/// @title Colu Local Network sale contract.
/// @author Tal Beja.
contract ColuLocalNetworkSale is Ownable, TokenHolder {
    using SafeMath for uint256;

    // External parties:

    // Colu Local Network contract.
    ColuLocalNetwork public cln;

    // Vesting contract for presale participants.
    VestingTrustee public trustee;

    // Received funds are forwarded to this address.
    address public fundingRecipient;

    // Post-TDE multisig addresses.
    address public communityPoolAddress;
    address public futureDevelopmentPoolAddress;
    address public stakeholdersPoolAddress;

    // Colu Local Network decimals.
    // Using same decimals value as ETH (makes ETH-CLN conversion much easier).
    // This is the same as in Colu Local Network contract.
    uint256 public constant TOKEN_DECIMALS = 10 ** 18;

    // Additional Lockup Allocation Pool
    uint256 public constant ALAP = 47751732000000023865524178;

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

    // Tokens allocated for Stakeholdes pool (6%).
    uint256 public constant STAKEHOLDERS_POOL = 9 * 10 ** 7 * TOKEN_DECIMALS;

    // CLN to ETH ratio.
    uint256 public constant CLN_PER_ETH = 3900;

    // Sale start, end blocks (time ranges)
    uint256 public constant SALE_DURATION = 7 days;
    uint256 public startTime;
    uint256 public endTime;

    // Amount of tokens sold until now in the sale.
    uint256 public tokensSold = 0;

    // Amount of tokens sold until now in the presale.
    uint256 public presaleTokensSold = 0;

    // Accumulated amount each participant has contributed so far in the sale (in WEI).
    mapping (address => uint256) public participationHistory;

    // Accumulated amount each participant have contributed so far in the presale.
    mapping (address => uint256) public participationPresaleHistory;

    // Maximum amount that each particular is allowed to contribute (in ETH-WEI).
    mapping (address => uint256) public participationCaps;

    // Maximum amount ANYONE is currently allowed to contribute. Set to max uint256 so no limitation other than personal participationCaps.
    uint256 public hardParticipationCap = uint256(-1);

    // initialization of the contract, splitted from the constructor to avoid gas block limit.
    bool public initialized = false;

    // Vesting plan structure for presale
    struct VestingPlan {
        uint256 startOffset;
        uint256 cliffOffset;
        uint256 endOffset;
        uint256 installmentLength;
        uint8 alapPercent;
    }

    // Vesting plans for presale
    VestingPlan[] public vestingPlans;

    // Each token that is sent from the ColuLocalNetworkSale is considered as issued.
    event TokensIssued(address indexed to, uint256 tokens);

    /// @dev Reverts if called not before the sale.
    modifier onlyBeforeSale() {
        if (now >= startTime) {
            revert();
        }

        _;
    }

    /// @dev Reverts if called not during the sale.
    modifier onlyDuringSale() {
        if (tokensSold >= MAX_TOKENS_SOLD || now < startTime || now >= endTime) {
            revert();
        }

        _;
    }

    /// @dev Reverts if called before the sale ends.
    modifier onlyAfterSale() {
        if (!(tokensSold >= MAX_TOKENS_SOLD || now >= endTime)) {
            revert();
        }

        _;
    }

    /// @dev Reverts if called before the sale is initialized.
    modifier notInitialized() {
        if (initialized) {
            revert();
        }

        _;
    }


    /// @dev Reverts if called after the sale is initialized.
    modifier isInitialized() {
        if (!initialized) {
            revert();
        }

        _;
    }

    /// @dev Constructor sets the sale addresses and start time.
    /// @param _owner address The address of this contract owner.
    /// @param _fundingRecipient address The address of the funding recipient.
    /// @param _communityPoolAddress address The address of the community pool.
    /// @param _futureDevelopmentPoolAddress address The address of the future development pool.
    /// @param _stakeholdersPoolAddress address The address of the team pool.
    /// @param _startTime uint256 The start time of the token sale.
    function ColuLocalNetworkSale(address _owner,
        address _fundingRecipient,
        address _communityPoolAddress,
        address _futureDevelopmentPoolAddress,
        address _stakeholdersPoolAddress,
        uint256 _startTime) public {
        require(_owner != address(0));
        require(_fundingRecipient != address(0));
        require(_communityPoolAddress != address(0));
        require(_futureDevelopmentPoolAddress != address(0));
        require(_stakeholdersPoolAddress != address(0));
        require(_startTime > now);

        owner = _owner;
        fundingRecipient = _fundingRecipient;
        communityPoolAddress = _communityPoolAddress;
        futureDevelopmentPoolAddress = _futureDevelopmentPoolAddress;
        stakeholdersPoolAddress = _stakeholdersPoolAddress;
        startTime = _startTime;
        endTime = startTime + SALE_DURATION;
    }

    /// @dev Initialize the sale conditions.
    function initialize() public onlyOwner notInitialized {
        initialized = true;

        uint256 months = 1 years / 12;

        vestingPlans.push(VestingPlan(0, 0, 1 days, 1 days, 0));
        vestingPlans.push(VestingPlan(0, 0, 6 * months, 1 * months, 4));
        vestingPlans.push(VestingPlan(0, 0, 1 years, 1 * months, 12));
        vestingPlans.push(VestingPlan(0, 0, 2 years, 1 * months, 26));
        vestingPlans.push(VestingPlan(0, 0, 3 years, 1 * months, 35));

        // Deploy new ColuLocalNetwork contract.
        cln = new ColuLocalNetwork(MAX_TOKENS);

        // Deploy new VestingTrustee contract.
        trustee = new VestingTrustee(cln);

        // allocate pool tokens:

        // Issue the remaining tokens to designated pools.
        transferTokens(communityPoolAddress, COMMUNITY_POOL);

        // stakeholdersPoolAddress will create its own vesting trusts.
        transferTokens(stakeholdersPoolAddress, STAKEHOLDERS_POOL);
    }

    /// @dev Allocate tokens to presale participant according to its vesting plan and invesment value.
    /// @param _recipient address The presale participant address to recieve the tokens.
    /// @param _etherValue uint256 The invesment value (in ETH).
    /// @param _vestingPlanIndex uint8 The vesting plan index.
    function presaleAllocation(address _recipient, uint256 _etherValue, uint8 _vestingPlanIndex) external onlyOwner onlyBeforeSale isInitialized {
        require(_recipient != address(0));
        require(_vestingPlanIndex < vestingPlans.length);

        // Calculate plan and token amount.
        VestingPlan memory plan = vestingPlans[_vestingPlanIndex];
        uint256 tokensAndALAPPerEth = CLN_PER_ETH.mul(SafeMath.add(100, plan.alapPercent)).div(100);

        uint256 tokensLeftInPreSale = MAX_PRESALE_TOKENS_SOLD.sub(presaleTokensSold);
        uint256 weiLeftInSale = tokensLeftInPreSale.div(tokensAndALAPPerEth);
        uint256 weiToParticipate = SafeMath.min256(_etherValue, weiLeftInSale);
        require(weiToParticipate > 0);
        participationPresaleHistory[msg.sender] = participationPresaleHistory[msg.sender].add(weiToParticipate);
        uint256 tokensToTransfer = weiToParticipate.mul(tokensAndALAPPerEth);
        presaleTokensSold = presaleTokensSold.add(tokensToTransfer);
        tokensSold = tokensSold.add(tokensToTransfer);

        // Transfer tokens to trustee and create grant.
        grant(_recipient, tokensToTransfer, startTime.add(plan.startOffset), startTime.add(plan.cliffOffset),
            startTime.add(plan.endOffset), plan.installmentLength, false);
    }

    /// @dev Add a list of participants to a capped participation tier.
    /// @param _participants address[] The list of participant addresses.
    /// @param _cap uint256 The cap amount (in ETH-WEI).
    function setParticipationCap(address[] _participants, uint256 _cap) external onlyOwner isInitialized {
        for (uint i = 0; i < _participants.length; i++) {
            participationCaps[_participants[i]] = _cap;
        }
    }

    /// @dev Set hard participation cap for all participants.
    /// @param _cap uint256 The hard cap amount.
    function setHardParticipationCap(uint256 _cap) external onlyOwner isInitialized {
        require(_cap > 0);

        hardParticipationCap = _cap;
    }

    /// @dev Fallback function that will delegate the request to create().
    function () external payable onlyDuringSale isInitialized {
        create(msg.sender);
    }

    /// @dev Create and sell tokens to the caller.
    /// @param _recipient address The address of the recipient receiving the tokens.
    function create(address _recipient) public payable onlyDuringSale isInitialized {
        require(_recipient != address(0));

        // Enforce participation cap (in WEI received).
        uint256 weiAlreadyParticipated = participationHistory[_recipient];
        uint256 participationCap = SafeMath.min256(participationCaps[_recipient], hardParticipationCap);
        uint256 cappedWeiReceived = SafeMath.min256(msg.value, participationCap.sub(weiAlreadyParticipated));
        require(cappedWeiReceived > 0);

        // Accept funds and transfer to funding recipient.
        uint256 tokensLeftInSale = MAX_TOKENS_SOLD.sub(tokensSold);
        uint256 weiLeftInSale = tokensLeftInSale.div(CLN_PER_ETH);
        uint256 weiToParticipate = SafeMath.min256(cappedWeiReceived, weiLeftInSale);
        participationHistory[_recipient] = weiAlreadyParticipated.add(weiToParticipate);
        fundingRecipient.transfer(weiToParticipate);

        // Transfer tokens to recipient.
        uint256 tokensToTransfer = weiToParticipate.mul(CLN_PER_ETH);
        if (tokensLeftInSale.sub(tokensToTransfer) < CLN_PER_ETH) {
            // If purchase would cause less than CLN_PER_ETH tokens to be left then nobody could ever buy them.
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

    /// @dev Finalizes the token sale event: make future development pool grant (lockup) and make token transfarable.
    function finalize() external onlyAfterSale onlyOwner isInitialized {
        if (cln.isTransferable()) {
            revert();
        }

        // Add unsold token to the future development pool grant (lockup).
        uint256 tokensLeftInSale = MAX_TOKENS_SOLD.sub(tokensSold);
        uint256 futureDevelopmentPool = FUTURE_DEVELOPMENT_POOL.add(tokensLeftInSale);
        // Future Development Pool is locked for 3 years.
        grant(futureDevelopmentPoolAddress, futureDevelopmentPool, startTime, startTime.add(3 years),
            startTime.add(3 years), 1 days, false);

        // Make tokens Transferable, end the sale!.
        cln.makeTokensTransferable();
    }

    function grant(address _grantee, uint256 _amount, uint256 _start, uint256 _cliff, uint256 _end,
        uint256 _installmentLength, bool _revokable) private {
        // bytes4 grantSig = bytes4(keccak256("grant(address,uint256,uint256,uint256,uint256,bool)"));
        bytes4 grantSig = 0x5ee7e96d;
        // 6 arguments of size 32
        uint256 argsSize = 6 * 32;
        // sig + arguments size
        uint256 dataSize = 4 + argsSize;

        bytes memory m_data = new bytes(dataSize);

        assembly {
            // Add the signature first to memory
            mstore(add(m_data, 0x20), grantSig)
            // Add the parameters
            mstore(add(m_data, 0x24), _grantee)
            mstore(add(m_data, 0x44), _start)
            mstore(add(m_data, 0x64), _cliff)
            mstore(add(m_data, 0x84), _end)
            mstore(add(m_data, 0xa4), _installmentLength)
            mstore(add(m_data, 0xc4), _revokable)
        }

        require(transferTokens(trustee, _amount, m_data));
    }

    /// @dev Transfer tokens from the sale contract to a recipient.
    /// @param _recipient address The address of the recipient.
    /// @param _tokens uint256 The amount of tokens to transfer.
    function transferTokens(address _recipient, uint256 _tokens) private returns (bool) {
        return (transferTokens(_recipient, _tokens, new bytes(0)));
    }

    /// @dev Transfer tokens from the sale contract to a recipient.
    /// @param _recipient address The address of the recipient.
    /// @param _tokens uint256 The amount of tokens to transfer.
    /// @param _data bytes data to send to reciever if it is a contract.
    function transferTokens(address _recipient, uint256 _tokens, bytes _data) private returns (bool ans) {
        // Request Colu Local Network contract to transfer the requested tokens for the buyer.
        ans = cln.transfer(_recipient, _tokens, _data);

        TokensIssued(_recipient, _tokens);
    }

    /// @dev Requests to transfer control of the Colu Local Network contract to a new owner.
    /// @param _newOwnerCandidate address The address to transfer ownership to.
    ///
    /// NOTE:
    ///   1. The new owner will need to call Colu Local Network contract's acceptOwnership directly in order to accept the ownership.
    ///   2. Calling this method during the token sale will prevent the token sale to continue, since only the owner of
    ///      the Colu Local Network contract can transfer tokens during the sale.
    function requestColuLocalNetworkOwnershipTransfer(address _newOwnerCandidate) external onlyOwner {
        cln.requestOwnershipTransfer(_newOwnerCandidate);
    }

    /// @dev Accepts new ownership on behalf of the Colu Local Network contract.
    // This can be used by the sale contract itself to claim back ownership of the Colu Local Network contract.
    function acceptColuLocalNetworkOwnership() external onlyOwner {
        cln.acceptOwnership();
    }

    /// @dev Requests to transfer control of the VestingTrustee contract to a new owner.
    /// @param _newOwnerCandidate address The address to transfer ownership to.
    ///
    /// NOTE:
    ///   1. The new owner will need to call trustee contract's acceptOwnership directly in order to accept the ownership.
    ///   2. Calling this method during the token sale will prevent the token sale from alocation presale grunts add finalize, since only the owner of
    ///      the trustee contract can create grunts needed in the presaleAlocation add finalize methods.
    function requestVestingTrusteeOwnershipTransfer(address _newOwnerCandidate) external onlyOwner {
        trustee.requestOwnershipTransfer(_newOwnerCandidate);
    }

    /// @dev Accepts new ownership on behalf of the VestingTrustee contract.
    /// This can be used by the token sale contract itself to claim back ownership of the VestingTrustee contract.
    function acceptVestingTrusteeOwnership() external onlyOwner {
        trustee.acceptOwnership();
    }
}