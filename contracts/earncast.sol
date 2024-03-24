// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@superfluid-finance/ethereum-contracts/contracts/apps/SuperTokenV1Library.sol";

contract EarnCast {
    using SuperTokenV1Library for ISuperToken;
    ISuperToken private superToken;
    ISuperfluidPool private pool;
    PoolConfig private poolConfig = PoolConfig({
        transferabilityForUnitsOwner: false,
        distributionFromAnyAddress: false
    });

    constructor() {
        superToken = ISuperToken(0xB7cdb472d884BD0a0Ba654cFAd60fC6D93e47e3c);
        pool = superToken.createPool(address(this), poolConfig);
    }

    // Use updateMemberUnits to assign units to a member
    function updateMemberUnits(address member, uint128 units) public {
        superToken.updateMemberUnits(pool, member, units);
    }

    function distribute(uint256 amount) public {
        superToken.distributeToPool(address(this), pool, amount);
    }
}
