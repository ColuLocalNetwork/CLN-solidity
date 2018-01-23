pragma solidity 0.4.18;

import './SafeMath.sol';
import './ColuLocalNetwork.sol';
import './TokenOwnable.sol';
import './ERC20.sol';

/// @title Vesting trustee contract for Colu Local Network.
/// @dev This Contract can't be TokenHolder, since it will allow its owner to drain its vested tokens.
/// @dev This means that any token sent to it different than ColuLocalNetwork is basicly stucked here forever.
/// @dev ColuLocalNetwork that sent here (by mistake) can withdrawn using the grant method. 
contract VestingTrustee is TokenOwnable {
    using SafeMath for uint256;

    // Colu Local Network contract.
    ColuLocalNetwork public cln;

    // Vesting grant for a speicifc holder.
    struct Grant {
        uint256 value;
        uint256 start;
        uint256 cliff;
        uint256 end;
        uint256 installmentLength; // In seconds.
        uint256 transferred;
        bool revokable;
    }

    // Holder to grant information mapping.
    mapping (address => Grant) public grants;

    // Total tokens vested.
    uint256 public totalVesting;

    event NewGrant(address indexed _from, address indexed _to, uint256 _value);
    event TokensUnlocked(address indexed _to, uint256 _value);
    event GrantRevoked(address indexed _holder, uint256 _refund);

    uint constant OK = 1;
    uint constant ERR_INVALID_VALUE = 10001;
    uint constant ERR_INVALID_VESTED = 10002;
    uint constant ERR_INVALID_TRANSFERABLE = 10003;

    event Error(address indexed sender, uint error);

    /// @dev Constructor that initializes the address of the Colu Local Network contract.
    /// @param _cln ColuLocalNetwork The address of the previously deployed Colu Local Network contract.
    function VestingTrustee(ColuLocalNetwork _cln) public {
        require(_cln != address(0));

        cln = _cln;
    }

    /// @dev Allow only cln token to be tokenPayable
    /// 
    function supportsToken(address token) public constant returns (bool) {
        return (cln == token);
    }

    /// @dev Grant tokens to a specified address.
    /// @param _to address The holder address.
    /// @param _start uint256 The beginning of the vesting period (timestamp).
    /// @param _cliff uint256 When the first installment is made (timestamp).
    /// @param _end uint256 The end of the vesting period (timestamp).
    /// @param _installmentLength uint256 The length of each vesting installment (in seconds).
    /// @param _revokable bool Whether the grant is revokable or not.
    function grant(address _to, uint256 _start, uint256 _cliff, uint256 _end,
        uint256 _installmentLength, bool _revokable)
        external tokenOnlyOwner tokenPayable {

        require(_to != address(0));
        require(_to != address(this)); // Protect this contract from receiving a grant.

        uint256 value = tkn.value;

        require(value > 0);

        // Require that every holder can be granted tokens only once.
        require(grants[_to].value == 0);

        // Require for time ranges to be consistent and valid.
        require(_start <= _cliff && _cliff <= _end);

        // Require installment length to be valid and no longer than (end - start).
        require(_installmentLength > 0 && _installmentLength <= _end.sub(_start));

        // Grant must not exceed the total amount of tokens currently available for vesting.
        require(totalVesting.add(value) <= cln.balanceOf(address(this)));

        // Assign a new grant.
        grants[_to] = Grant({
            value: value,
            start: _start,
            cliff: _cliff,
            end: _end,
            installmentLength: _installmentLength,
            transferred: 0,
            revokable: _revokable
        });

        // Since tokens have been granted, increase the total amount vested.
        totalVesting = totalVesting.add(value);

        NewGrant(msg.sender, _to, value);
    }

    /// @dev Grant tokens to a specified address.
    /// @param _to address The holder address.
    /// @param _value uint256 The amount of tokens to be granted.
    /// @param _start uint256 The beginning of the vesting period (timestamp).
    /// @param _cliff uint256 When the first installment is made (timestamp).
    /// @param _end uint256 The end of the vesting period (timestamp).
    /// @param _installmentLength uint256 The length of each vesting installment (in seconds).
    /// @param _revokable bool Whether the grant is revokable or not.
    function grant(address _to, uint256 _value, uint256 _start, uint256 _cliff, uint256 _end,
        uint256 _installmentLength, bool _revokable)
        external onlyOwner {

        require(_to != address(0));
        require(_to != address(this)); // Protect this contract from receiving a grant.
        require(_value > 0);

        // Require that every holder can be granted tokens only once.
        require(grants[_to].value == 0);

        // Require for time ranges to be consistent and valid.
        require(_start <= _cliff && _cliff <= _end);

        // Require installment length to be valid and no longer than (end - start).
        require(_installmentLength > 0 && _installmentLength <= _end.sub(_start));

        // Grant must not exceed the total amount of tokens currently available for vesting.
        require(totalVesting.add(_value) <= cln.balanceOf(address(this)));

        // Assign a new grant.
        grants[_to] = Grant({
            value: _value,
            start: _start,
            cliff: _cliff,
            end: _end,
            installmentLength: _installmentLength,
            transferred: 0,
            revokable: _revokable
        });

        // Since tokens have been granted, increase the total amount vested.
        totalVesting = totalVesting.add(_value);

        NewGrant(msg.sender, _to, _value);
    }

    /// @dev Revoke the grant of tokens of a specifed address.
    /// @dev Unlocked tokens will be sent to the grantee, the rest is transferred to the trustee's owner.
    /// @param _holder The address which will have its tokens revoked.
    function revoke(address _holder) public onlyOwner {
        Grant memory grant = grants[_holder];

        // Grant must be revokable.
        require(grant.revokable);

        // Get the total amount of vested tokens, acccording to grant.
        uint256 vested = calculateVestedTokens(grant, now);

        // Calculate the untransferred vested tokens.
        uint256 transferable = vested.sub(grant.transferred);

        if (transferable > 0) {
            // Update transferred and total vesting amount, then transfer remaining vested funds to holder.
            grant.transferred = grant.transferred.add(transferable);
            totalVesting = totalVesting.sub(transferable);
            require(cln.transfer(_holder, transferable));

            TokensUnlocked(_holder, transferable);
        }

        // Calculate amount of remaining tokens that can still be returned.
        uint256 refund = grant.value.sub(grant.transferred);

        // Remove the grant.
        delete grants[_holder];

        // Update total vesting amount and transfer previously calculated tokens to owner.
        totalVesting = totalVesting.sub(refund);
        require(cln.transfer(msg.sender, refund));

        GrantRevoked(_holder, refund);
    }

    /// @dev Calculate the amount of ready tokens of a holder.
    /// @param _holder address The address of the holder.
    /// @return a uint256 Representing a holder's total amount of vested tokens.
    function readyTokens(address _holder) public constant returns (uint256) {
        Grant memory grant = grants[_holder];
        
        if (grant.value == 0) {
            return 0;
        }

        uint256 vested = calculateVestedTokens(grant, now);
        
        if (vested == 0) {
            return 0;
        }

        return vested.sub(grant.transferred);
    }

    /// @dev Calculate the total amount of vested tokens of a holder at a given time.
    /// @param _holder address The address of the holder.
    /// @param _time uint256 The specific time to calculate against.
    /// @return a uint256 Representing a holder's total amount of vested tokens.
    function vestedTokens(address _holder, uint256 _time) public constant returns (uint256) {
        Grant memory grant = grants[_holder];
        if (grant.value == 0) {
            return 0;
        }

        return calculateVestedTokens(grant, _time);
    }

    /// @dev Calculate amount of vested tokens at a specifc time.
    /// @param _grant Grant The vesting grant.
    /// @param _time uint256 The time to be checked
    /// @return An uint256 Representing the amount of vested tokens of a specific grant.
    function calculateVestedTokens(Grant _grant, uint256 _time) private pure returns (uint256) {
        // If we're before the cliff, then nothing is vested.
        if (_time < _grant.cliff) {
            return 0;
        }

        // If we're after the end of the vesting period - everything is vested.
        if (_time >= _grant.end) {
            return _grant.value;
        }

        // Calculate amount of installments past until now.
        //
        // NOTE: result gets floored because of integer division.
        uint256 installmentsPast = _time.sub(_grant.start).div(_grant.installmentLength);

        // Calculate amount of days in entire vesting period.
        uint256 vestingDays = _grant.end.sub(_grant.start);

        // Calculate and return the number of tokens according to vesting days that have passed.
        return _grant.value.mul(installmentsPast.mul(_grant.installmentLength)).div(vestingDays);
    }

    /// @dev Unlock vested tokens and transfer them to the grantee.
    /// @return a uint The success or error code.
    function unlockVestedTokens() external returns (uint) {
        unlockVestedTokens(msg.sender);
    }

    /// @dev Unlock vested tokens and transfer them to the grantee (helper function).
    /// @param _grantee address The address of the grantee.
    /// @return a uint The success or error code.
    function unlockVestedTokens(address _grantee) private returns (uint) {
        Grant storage grant = grants[_grantee];

        // Make sure the grant has tokens available.
        if (grant.value == 0) {
            Error(_grantee, ERR_INVALID_VALUE);
            return ERR_INVALID_VALUE;
        }

        // Get the total amount of vested tokens, acccording to grant.
        uint256 vested = calculateVestedTokens(grant, now);
        if (vested == 0) {
            Error(_grantee, ERR_INVALID_VESTED);
            return ERR_INVALID_VESTED;
        }

        // Make sure the holder doesn't transfer more than what he already has.
        uint256 transferable = vested.sub(grant.transferred);
        if (transferable == 0) {
            Error(_grantee, ERR_INVALID_TRANSFERABLE);
            return ERR_INVALID_TRANSFERABLE;
        }

        // Update transferred and total vesting amount, then transfer remaining vested funds to holder.
        grant.transferred = grant.transferred.add(transferable);
        totalVesting = totalVesting.sub(transferable);
        require(cln.transfer(_grantee, transferable));

        TokensUnlocked(_grantee, transferable);
        return OK; 
    }

    /// @dev batchUnlockVestedTokens vested tokens and transfer them to the grantees.
    /// @param _grantees address[] The addresses of the grantees.
    /// @return a boo if success.
    function batchUnlockVestedTokens(address[] _grantees) external onlyOwner returns (bool success) {
        for (uint i=0; i<_grantees.length; i++) {
            unlockVestedTokens(_grantees[i]);
        }
        return true;
    }

    /// @dev Allow the owner to transfer out any accidentally sent ERC20 tokens.
    /// @param _tokenAddress address The address of the ERC20 contract.
    /// @param _amount uint256 The amount of tokens to be transferred.
    function withdrawERC20(address _tokenAddress, uint256 _amount) public onlyOwner returns (bool success) {
        if (_tokenAddress == address(cln)) {
            // If the token is cln, allow to withdraw only non vested tokens.
            uint256 availableCLN = cln.balanceOf(this).sub(totalVesting);
            require(_amount <= availableCLN);
        }
        return ERC20(_tokenAddress).transfer(owner, _amount);
    }
}