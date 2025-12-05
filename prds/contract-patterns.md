# Smart Contract Patterns

## Structure

// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

contract QueryRegistry is Ownable {
// 1. Structs
// 2. State variables
// 3. Events
// 4. Errors
// 5. Functions
}

text

## Custom Errors (Always)

// ✅ Use this
error InvalidPayment();
if (msg.value == 0) revert InvalidPayment();

// ❌ Not this
require(msg.value > 0, "Invalid payment");

text

## Events

event QueryRegistered(
bytes32 indexed queryId,
address indexed user,
uint256 amount
);

text

## Testing

function testRegisterQuery() public {
vm.prank(user);
registry.registerQuery{value: 0.1 ether}(keccak256("test"));

text
assertEq(registry.queries(queryId).user, user);
}

text

## Deploy

forge script script/Deploy.s.sol
--rpc-url $FUJI_RPC_URL
--private-key $PRIVATE_KEY
--broadcast --verify

text
