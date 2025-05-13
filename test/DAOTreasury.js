const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-network-helpers");

describe("DAOTreasury", function () {
    let token, treasury, owner, addr1, addr2;

    beforeEach(async function () {
        [owner, addr1, addr2] = await ethers.getSigners();
        const Token = await ethers.getContractFactory("MyToken");
        token = await Token.deploy();
        await token.waitForDeployment();

        const tokenAddress = await token.getAddress();
        const DAOTreasury = await ethers.getContractFactory("DAOTreasury");
        treasury = await DAOTreasury.deploy(tokenAddress);
        await treasury.waitForDeployment();

        // Transfer tokens to addr1 and addr2
        const addr1Address = await addr1.getAddress();
        const addr2Address = await addr2.getAddress();
        await token.transfer(addr1Address, ethers.parseEther("5000"));
        await token.transfer(addr2Address, ethers.parseEther("2000"));
    });

    it("should allow depositing tokens", async function () {
        const addr1Address = await addr1.getAddress();
        const treasuryAddress = await treasury.getAddress();
        await token.connect(addr1).approve(treasuryAddress, ethers.parseEther("1000"));
        await treasury.connect(addr1).deposit(ethers.parseEther("1000"));
        expect(await treasury.getTreasuryBalance()).to.equal(ethers.parseEther("1000"));
    });

    it("should allow creating and voting on a proposal", async function () {
        const addr1Address = await addr1.getAddress();
        const addr2Address = await addr2.getAddress();
        const treasuryAddress = await treasury.getAddress();

        await token.connect(addr1).approve(treasuryAddress, ethers.parseEther("1000"));
        await treasury.connect(addr1).deposit(ethers.parseEther("1000"));

        await treasury.connect(addr1).createProposal(
            "Test proposal",
            addr2Address,
            ethers.parseEther("500")
        );

        await treasury.connect(addr1).vote(1, true);
        await treasury.connect(addr2).vote(1, true);

        // Mine 40321 blocks to ensure we're past the voting period
        // VOTING_PERIOD = 40320 in the contract
        await mine(40321);

        await treasury.connect(addr1).executeProposal(1);
        expect(await token.balanceOf(addr2Address)).to.equal(ethers.parseEther("2500"));
    });
});