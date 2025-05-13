const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    // Deploy Token
    const Token = await ethers.getContractFactory("MyToken");
    const token = await Token.deploy();
    // Wait for the transaction to be mined
    await token.waitForDeployment();
    console.log("Token deployed to:", await token.getAddress());

    // Deploy DAOTreasury
    const DAOTreasury = await ethers.getContractFactory("DAOTreasury");
    const tokenAddress = await token.getAddress();
    const treasury = await DAOTreasury.deploy(tokenAddress);
    // Wait for the transaction to be mined
    await treasury.waitForDeployment();
    console.log("DAOTreasury deployed to:", await treasury.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });