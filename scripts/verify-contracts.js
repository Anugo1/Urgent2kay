const hre = require("hardhat");

async function main() {
  console.log("Verifying deployed contracts on Base Sepolia...");
  
  // Contract addresses from the deployment
  const tokenAddress = "0x6CC3eD7c089a866f822Cc7182C30A07c75647eDA";
  const paymentSystemAddress = "0xce9a1ADa0fdbAD99b2391Eba5fCC304B8321a0be";
  
  // Get the deployer address
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = deployer.address;
  console.log("Deployer address:", deployerAddress);
  
  console.log("\nVerifying U2K Token contract...");
  try {
    await hre.run("verify:verify", {
      address: tokenAddress,
      constructorArguments: [deployerAddress],
    });
    console.log("✅ U2K Token contract verified successfully!");
  } catch (error) {
    console.error("❌ Error verifying U2K Token contract:", error.message);
  }
  
  console.log("\nVerifying BillPaymentSystem contract...");
  try {
    await hre.run("verify:verify", {
      address: paymentSystemAddress,
      constructorArguments: [tokenAddress, deployerAddress],
    });
    console.log("✅ BillPaymentSystem contract verified successfully!");
  } catch (error) {
    console.error("❌ Error verifying BillPaymentSystem contract:", error.message);
  }
  
  console.log("\nVerification process complete!");
  console.log("You can view your contracts on Base Sepolia Explorer:");
  console.log(`U2K Token: https://sepolia.basescan.org/address/${tokenAddress}`);
  console.log(`BillPaymentSystem: https://sepolia.basescan.org/address/${paymentSystemAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 