// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {QueryRegistry} from "../src/QueryRegistry.sol";
import {AgentRegistry} from "../src/AgentRegistry.sol";

contract DeployScript is Script {
    function run() public {
        vm.startBroadcast();

        QueryRegistry queryRegistry = new QueryRegistry();
        AgentRegistry agentRegistry = new AgentRegistry();

        console.log("QueryRegistry:", address(queryRegistry));
        console.log("AgentRegistry:", address(agentRegistry));

        vm.stopBroadcast();
    }
}
