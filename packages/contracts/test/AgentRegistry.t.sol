// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";

contract AgentRegistryTest is Test {
    AgentRegistry public registry;
    address public owner;
    address public agent;

    event AgentRegistered(address indexed agent, string name);
    event ReputationUpdated(address indexed agent, uint256 newScore);

    function setUp() public {
        owner = address(this);
        agent = makeAddr("agent");
        registry = new AgentRegistry();
    }

    /*//////////////////////////////////////////////////////////////
                            DEPLOYMENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_DeploymentSetsOwner() public view {
        assertEq(registry.owner(), owner);
    }

    function test_InitialAgentCountIsZero() public view {
        assertEq(registry.getAgentCount(), 0);
    }

    /*//////////////////////////////////////////////////////////////
                        REGISTER AGENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RegisterAgent() public {
        vm.prank(agent);
        registry.registerAgent("TestAgent");

        AgentRegistry.Agent memory a = registry.getAgent(agent);

        assertEq(a.name, "TestAgent");
        assertEq(a.owner, agent);
        assertEq(a.reputationScore, 50);
        assertEq(a.totalQueries, 0);
        assertEq(a.successfulQueries, 0);
        assertTrue(a.isActive);
    }

    function test_RegisterAgentEmitsEvent() public {
        vm.expectEmit(true, false, false, true);
        emit AgentRegistered(agent, "TestAgent");

        vm.prank(agent);
        registry.registerAgent("TestAgent");
    }

    function test_RegisterAgentIncreasesCount() public {
        vm.prank(agent);
        registry.registerAgent("Agent1");

        address agent2 = makeAddr("agent2");
        vm.prank(agent2);
        registry.registerAgent("Agent2");

        assertEq(registry.getAgentCount(), 2);
    }

    function test_AgentAddedToList() public {
        vm.prank(agent);
        registry.registerAgent("TestAgent");

        assertEq(registry.agentList(0), agent);
    }

    function test_RevertWhen_RegisterAgentTwice() public {
        vm.startPrank(agent);
        registry.registerAgent("TestAgent");

        vm.expectRevert(AgentRegistry.AgentAlreadyRegistered.selector);
        registry.registerAgent("TestAgent2");
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                      UPDATE REPUTATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_UpdateReputationSuccess() public {
        vm.prank(agent);
        registry.registerAgent("TestAgent");

        registry.updateReputation(agent, true);

        AgentRegistry.Agent memory a = registry.getAgent(agent);
        assertEq(a.reputationScore, 51);
        assertEq(a.totalQueries, 1);
        assertEq(a.successfulQueries, 1);
    }

    function test_UpdateReputationFailure() public {
        vm.prank(agent);
        registry.registerAgent("TestAgent");

        registry.updateReputation(agent, false);

        AgentRegistry.Agent memory a = registry.getAgent(agent);
        assertEq(a.reputationScore, 49);
        assertEq(a.totalQueries, 1);
        assertEq(a.successfulQueries, 0);
    }

    function test_UpdateReputationEmitsEvent() public {
        vm.prank(agent);
        registry.registerAgent("TestAgent");

        vm.expectEmit(true, false, false, true);
        emit ReputationUpdated(agent, 51);

        registry.updateReputation(agent, true);
    }

    function test_ReputationCapsAt100() public {
        vm.prank(agent);
        registry.registerAgent("TestAgent");

        // Increase from 50 to 100 (50 successful queries)
        for (uint256 i = 0; i < 55; i++) {
            registry.updateReputation(agent, true);
        }

        AgentRegistry.Agent memory a = registry.getAgent(agent);
        assertEq(a.reputationScore, 100);
    }

    function test_ReputationFloorsAtZero() public {
        vm.prank(agent);
        registry.registerAgent("TestAgent");

        // Decrease from 50 to 0 (50 failed queries)
        for (uint256 i = 0; i < 55; i++) {
            registry.updateReputation(agent, false);
        }

        AgentRegistry.Agent memory a = registry.getAgent(agent);
        assertEq(a.reputationScore, 0);
    }

    function test_RevertWhen_NonOwnerUpdatesReputation() public {
        vm.prank(agent);
        registry.registerAgent("TestAgent");

        vm.prank(agent);
        vm.expectRevert();
        registry.updateReputation(agent, true);
    }

    function test_RevertWhen_UpdateNonExistentAgent() public {
        vm.expectRevert(AgentRegistry.AgentNotFound.selector);
        registry.updateReputation(agent, true);
    }

    /*//////////////////////////////////////////////////////////////
                            GET AGENT TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetAgentReturnsCorrectData() public {
        vm.prank(agent);
        registry.registerAgent("TestAgent");

        AgentRegistry.Agent memory a = registry.getAgent(agent);

        assertEq(a.name, "TestAgent");
        assertEq(a.owner, agent);
    }

    function test_RevertWhen_GetNonExistentAgent() public {
        vm.expectRevert(AgentRegistry.AgentNotFound.selector);
        registry.getAgent(agent);
    }

    /*//////////////////////////////////////////////////////////////
                              FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_RegisterAgent(
        address _agent,
        string calldata _name
    ) public {
        vm.assume(_agent != address(0));

        vm.prank(_agent);
        registry.registerAgent(_name);

        AgentRegistry.Agent memory a = registry.getAgent(_agent);
        assertEq(a.name, _name);
        assertEq(a.owner, _agent);
        assertEq(a.reputationScore, 50);
    }

    function testFuzz_ReputationUpdates(
        uint8 successes,
        uint8 failures
    ) public {
        vm.prank(agent);
        registry.registerAgent("TestAgent");

        for (uint8 i = 0; i < successes; i++) {
            registry.updateReputation(agent, true);
        }
        for (uint8 i = 0; i < failures; i++) {
            registry.updateReputation(agent, false);
        }

        AgentRegistry.Agent memory a = registry.getAgent(agent);
        assertEq(a.totalQueries, uint256(successes) + uint256(failures));
        assertEq(a.successfulQueries, successes);
    }
}
