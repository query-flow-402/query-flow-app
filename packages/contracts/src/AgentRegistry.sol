// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentRegistry
 * @author QueryFlow Team
 * @notice Manages AI agent identity and reputation on-chain
 * @dev Uses OpenZeppelin Ownable for access control on reputation updates
 */
contract AgentRegistry is Ownable {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Represents a registered AI agent
    /// @param name Display name of the agent
    /// @param owner Address that owns/controls the agent
    /// @param reputationScore Current reputation score (0-100)
    /// @param totalQueries Total number of queries handled
    /// @param successfulQueries Number of successful queries
    /// @param isActive Whether the agent is currently active
    struct Agent {
        string name;
        address owner;
        uint256 reputationScore;
        uint256 totalQueries;
        uint256 successfulQueries;
        bool isActive;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Mapping from agent address to Agent struct
    mapping(address => Agent) public agents;

    /// @notice List of all registered agent addresses
    address[] public agentList;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new agent is registered
    /// @param agent Address of the registered agent
    /// @param name Display name of the agent
    event AgentRegistered(address indexed agent, string name);

    /// @notice Emitted when an agent's reputation is updated
    /// @param agent Address of the agent
    /// @param newScore Updated reputation score
    event ReputationUpdated(address indexed agent, uint256 newScore);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Thrown when attempting to register an already registered agent
    error AgentAlreadyRegistered();

    /// @notice Thrown when querying a non-existent agent
    error AgentNotFound();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Initializes the contract with the deployer as owner
    constructor() Ownable(msg.sender) {}

    /*//////////////////////////////////////////////////////////////
                           EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Registers the caller as a new AI agent
     * @dev Anyone can register themselves with an initial reputation of 50
     * @param name Display name for the agent
     */
    function registerAgent(string calldata name) external {
        if (agents[msg.sender].owner != address(0)) {
            revert AgentAlreadyRegistered();
        }

        agents[msg.sender] = Agent({
            name: name,
            owner: msg.sender,
            reputationScore: 50,
            totalQueries: 0,
            successfulQueries: 0,
            isActive: true
        });

        agentList.push(msg.sender);

        emit AgentRegistered(msg.sender, name);
    }

    /**
     * @notice Updates an agent's reputation based on query outcome
     * @dev Only callable by the contract owner (backend service)
     * @param agent Address of the agent to update
     * @param success Whether the query was successful
     */
    function updateReputation(address agent, bool success) external onlyOwner {
        if (agents[agent].owner == address(0)) revert AgentNotFound();

        Agent storage a = agents[agent];
        a.totalQueries++;

        if (success) {
            a.successfulQueries++;
            if (a.reputationScore < 100) {
                a.reputationScore++;
            }
        } else {
            if (a.reputationScore > 0) {
                a.reputationScore--;
            }
        }

        emit ReputationUpdated(agent, a.reputationScore);
    }

    /**
     * @notice Retrieves an agent's full details
     * @param agent Address of the agent to query
     * @return The Agent struct containing all agent details
     */
    function getAgent(address agent) external view returns (Agent memory) {
        if (agents[agent].owner == address(0)) revert AgentNotFound();
        return agents[agent];
    }

    /**
     * @notice Returns the total number of registered agents
     * @return The count of registered agents
     */
    function getAgentCount() external view returns (uint256) {
        return agentList.length;
    }
}
