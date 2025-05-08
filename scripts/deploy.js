const hre = require("hardhat");

async function main() {
  console.log("Deploying U2K System...");

  // Deploy the factory
  const U2KSystemFactory = await hre.ethers.getContractFactory("U2KSystemFactory");
  const factory = await U2KSystemFactory.deploy();
  
  // Wait for deployment to complete
  await factory.waitForDeployment();
  console.log("U2KSystemFactory deployed to:", await factory.getAddress());

  // Use the factory to deploy the system
  const tx = await factory.deploySystem();
  const receipt = await tx.wait();
  console.log("System deployment transaction complete");

  // In ethers v6, we need to get logs and decode them
  // Get the factory address to use for filtering events
  const factoryAddress = await factory.getAddress();
  
  // Get the SystemDeployed event from the logs
  const systemDeployedInterface = new hre.ethers.Interface([
    "event SystemDeployed(address indexed token, address indexed paymentSystem, address indexed deployer)"
  ]);
  
  // Filter through logs to find our event
  const logs = receipt.logs;
  let tokenAddress, paymentSystemAddress, deployer;
  
  for (const log of logs) {
    // Check if this log is from our factory contract
    if (log.address.toLowerCase() === factoryAddress.toLowerCase()) {
      try {
        const parsedLog = systemDeployedInterface.parseLog(log);
        if (parsedLog && parsedLog.name === "SystemDeployed") {
          [tokenAddress, paymentSystemAddress, deployer] = [
            parsedLog.args[0],
            parsedLog.args[1],
            parsedLog.args[2]
          ];
          break;
        }
      } catch (e) {
        // Skip logs that can't be parsed as our event
        continue;
      }
    }
  }
  
  if (!tokenAddress || !paymentSystemAddress) {
    console.log("Could not find SystemDeployed event in transaction logs");
    // Get deployed values directly from the contract
    const u2kToken = await factory.u2kToken();
    const billPaymentSystem = await factory.billPaymentSystem();
    console.log("Retrieved values from contract:");
    console.log("U2K Token deployed to:", u2kToken);
    console.log("BillPaymentSystem deployed to:", billPaymentSystem);
  } else {
    console.log("Deployment complete!");
    console.log("U2K Token deployed to:", tokenAddress);
    console.log("BillPaymentSystem deployed to:", paymentSystemAddress);
    console.log("Deployer:", deployer);
  }

  // Verify contracts on Etherscan (optional, for public networks)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    await tx.wait(5); // Wait for 5 confirmations

    const factoryAddress = await factory.getAddress();
    const u2kToken = await factory.u2kToken();
    const billPaymentSystem = await factory.billPaymentSystem();

    // Verify the contracts
    await hre.run("verify:verify", {
      address: u2kToken,
      constructorArguments: [factoryAddress],
    });

    await hre.run("verify:verify", {
      address: billPaymentSystem,
      constructorArguments: [u2kToken, deployer],
    });

    await hre.run("verify:verify", {
      address: factoryAddress,
      constructorArguments: [],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });