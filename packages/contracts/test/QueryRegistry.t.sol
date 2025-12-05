// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {QueryRegistry} from "../src/QueryRegistry.sol";

contract QueryRegistryTest is Test {
    QueryRegistry public registry;
    address public owner;
    address public user;

    event QueryRecorded(
        uint256 indexed queryId,
        address indexed user,
        string queryType,
        uint256 payment
    );

    function setUp() public {
        owner = address(this);
        user = makeAddr("user");
        registry = new QueryRegistry();
    }

    /*//////////////////////////////////////////////////////////////
                            DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_DeploymentSetsOwner() public view {
        assertEq(registry.owner(), owner);
    }

    function test_InitialQueryCountIsZero() public view {
        assertEq(registry.queryCount(), 0);
    }

    /*//////////////////////////////////////////////////////////////
                          RECORD QUERY TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RecordQuery() public {
        bytes32 resultHash = keccak256("test result");

        uint256 queryId = registry.recordQuery(
            user,
            "chat",
            1 ether,
            resultHash
        );

        assertEq(queryId, 0);
        assertEq(registry.queryCount(), 1);

        QueryRegistry.Query memory query = registry.getQuery(0);
        assertEq(query.user, user);
        assertEq(query.queryType, "chat");
        assertEq(query.payment, 1 ether);
        assertEq(query.resultHash, resultHash);
        assertEq(query.timestamp, block.timestamp);
    }

    function test_RecordQueryEmitsEvent() public {
        bytes32 resultHash = keccak256("test result");

        vm.expectEmit(true, true, false, true);
        emit QueryRecorded(0, user, "chat", 1 ether);

        registry.recordQuery(user, "chat", 1 ether, resultHash);
    }

    function test_RecordMultipleQueries() public {
        bytes32 hash1 = keccak256("result1");
        bytes32 hash2 = keccak256("result2");

        address user2 = makeAddr("user2");

        registry.recordQuery(user, "chat", 1 ether, hash1);
        registry.recordQuery(user2, "image", 2 ether, hash2);

        assertEq(registry.queryCount(), 2);

        QueryRegistry.Query memory q1 = registry.getQuery(0);
        QueryRegistry.Query memory q2 = registry.getQuery(1);

        assertEq(q1.user, user);
        assertEq(q2.user, user2);
        assertEq(q1.queryType, "chat");
        assertEq(q2.queryType, "image");
    }

    function test_RevertWhen_RecordQueryWithZeroAddress() public {
        vm.expectRevert(QueryRegistry.InvalidUser.selector);
        registry.recordQuery(address(0), "chat", 1 ether, bytes32(0));
    }

    function test_RevertWhen_NonOwnerRecordsQuery() public {
        vm.prank(user);
        vm.expectRevert();
        registry.recordQuery(user, "chat", 1 ether, bytes32(0));
    }

    /*//////////////////////////////////////////////////////////////
                            GET QUERY TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetQueryReturnsCorrectData() public {
        bytes32 resultHash = keccak256("test");
        registry.recordQuery(user, "analysis", 0.5 ether, resultHash);

        QueryRegistry.Query memory query = registry.getQuery(0);

        assertEq(query.user, user);
        assertEq(query.queryType, "analysis");
        assertEq(query.payment, 0.5 ether);
        assertEq(query.resultHash, resultHash);
    }

    function test_RevertWhen_GetNonExistentQuery() public {
        vm.expectRevert(QueryRegistry.QueryNotFound.selector);
        registry.getQuery(0);
    }

    function test_RevertWhen_GetQueryIdOutOfBounds() public {
        registry.recordQuery(user, "chat", 1 ether, bytes32(0));

        vm.expectRevert(QueryRegistry.QueryNotFound.selector);
        registry.getQuery(1);
    }

    /*//////////////////////////////////////////////////////////////
                              FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_RecordQuery(
        address _user,
        string calldata _queryType,
        uint256 _payment,
        bytes32 _resultHash
    ) public {
        vm.assume(_user != address(0));

        uint256 queryId = registry.recordQuery(
            _user,
            _queryType,
            _payment,
            _resultHash
        );

        QueryRegistry.Query memory query = registry.getQuery(queryId);
        assertEq(query.user, _user);
        assertEq(query.queryType, _queryType);
        assertEq(query.payment, _payment);
        assertEq(query.resultHash, _resultHash);
    }
}
