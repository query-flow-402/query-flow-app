// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title QueryRegistry
 * @author QueryFlow Team
 * @notice Tracks AI queries on-chain for transparency and auditability
 * @dev Uses OpenZeppelin Ownable for access control on query recording
 */
contract QueryRegistry is Ownable {
    /*//////////////////////////////////////////////////////////////
                                STRUCTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Represents a recorded AI query
    /// @param user Address of the user who initiated the query
    /// @param queryType Type/category of the query (e.g., "chat", "image")
    /// @param payment Amount paid for the query in wei
    /// @param resultHash IPFS hash or keccak256 of the query result
    /// @param timestamp Block timestamp when the query was recorded
    struct Query {
        address user;
        string queryType;
        uint256 payment;
        bytes32 resultHash;
        uint256 timestamp;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Mapping from query ID to Query struct
    mapping(uint256 => Query) public queries;

    /// @notice Total number of queries recorded
    uint256 public queryCount;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new query is recorded
    /// @param queryId Unique identifier for the query
    /// @param user Address of the user who initiated the query
    /// @param queryType Type/category of the query
    /// @param payment Amount paid for the query
    event QueryRecorded(
        uint256 indexed queryId,
        address indexed user,
        string queryType,
        uint256 payment
    );

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Thrown when querying a non-existent query ID
    error QueryNotFound();

    /// @notice Thrown when user address is zero
    error InvalidUser();

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Initializes the contract with the deployer as owner
    constructor() Ownable(msg.sender) {}

    /*//////////////////////////////////////////////////////////////
                           EXTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Records a new AI query on-chain
     * @dev Only callable by the contract owner (backend service)
     * @param user Address of the user who initiated the query
     * @param queryType Type/category of the query
     * @param payment Amount paid for the query in wei
     * @param resultHash Hash of the query result for verification
     * @return queryId The unique identifier assigned to this query
     */
    function recordQuery(
        address user,
        string calldata queryType,
        uint256 payment,
        bytes32 resultHash
    ) external onlyOwner returns (uint256 queryId) {
        if (user == address(0)) revert InvalidUser();

        queryId = queryCount++;

        queries[queryId] = Query({
            user: user,
            queryType: queryType,
            payment: payment,
            resultHash: resultHash,
            timestamp: block.timestamp
        });

        emit QueryRecorded(queryId, user, queryType, payment);
    }

    /**
     * @notice Retrieves a recorded query by its ID
     * @param queryId The unique identifier of the query
     * @return query The Query struct containing all query details
     */
    function getQuery(
        uint256 queryId
    ) external view returns (Query memory query) {
        if (queryId >= queryCount) revert QueryNotFound();
        query = queries[queryId];
    }
}
