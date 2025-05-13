#!/bin/bash

# This script will reset the local blockchain and redeploy all contracts with proper timestamps

echo "🧹 Cleaning up previous deployment..."
# Kill any running hardhat node process
pkill -f "hardhat node" || true

echo "🚀 Starting local hardhat node in the background..."
npx hardhat node > hardhat-node.log 2>&1 &
NODE_PID=$!

# Wait for the node to start
echo "⏳ Waiting for the node to start..."
sleep 5

echo "🔄 Deploying contracts..."
npm run deploy:local

echo "💾 Saving deployment info..."
npm run save-local

echo "⏰ Syncing blockchain time to current time..."
npm run sync-time

echo "💰 Minting test tokens..."
npm run mint-local

echo "✅ Setup complete! Your local blockchain is running with contracts deployed at current time."
echo "📝 Note: To kill the hardhat node, run: kill $NODE_PID"
echo "🌐 You can now start the frontend with: npm run client" 