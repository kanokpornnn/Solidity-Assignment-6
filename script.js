
const contractAddress = "0x7ca6bd2e327b247ffe68230ee4ffc5eb801e6dbb";

const contractABI = [
    "function deposit() payable",
    "function withdraw(uint256 amount)",
    "function checkBalance() view returns (uint256)"
];

const SEPOLIA_CHAIN_ID = "0xaa36a7";

let provider;
let signer;
let contract;

const connectBtn = document.getElementById("connectBtn");
const checkBtn = document.getElementById("checkBtn");
const depositBtn = document.getElementById("depositBtn");
const withdrawBtn = document.getElementById("withdrawBtn");
const walletAddress = document.getElementById("walletAddress");
const balance = document.getElementById("balance");
const amountInput = document.getElementById("amount");
const statusText = document.getElementById("status");

function showStatus(message) {
    statusText.textContent = message;
}

function getError(error) {
    if (error.code === 4001 || error.code === "ACTION_REJECTED") {
        return "Transaction cancelled.";
    }
    return error.shortMessage || error.message || "Something went wrong.";
}

async function connectWallet() {
    try {
        if (!window.ethereum) {
            showStatus("Please install MetaMask.");
            return;
        }

        const chainId = await window.ethereum.request({
            method: "eth_chainId"
        });

        if (chainId.toLowerCase() !== SEPOLIA_CHAIN_ID) {
            showStatus("Please switch MetaMask to Sepolia Testnet.");
            return;
        }

        provider = new ethers.BrowserProvider(window.ethereum);

        await provider.send("eth_requestAccounts", []);

        signer = await provider.getSigner();

        contract = new ethers.Contract(
            contractAddress,
            contractABI,
            signer
        );

        const address = await signer.getAddress();

        walletAddress.textContent = address;
        connectBtn.textContent = "Wallet Connected";

        showStatus("Wallet connected successfully.");

        await checkBalance();
    } catch (error) {
        showStatus(getError(error));
    }
}

async function checkBalance() {
    try {
        if (!contract) {
            showStatus("Please connect your wallet first.");
            return;
        }

        const result = await contract.checkBalance();
        balance.textContent = ethers.formatEther(result) + " ETH";

        showStatus("Balance updated.");
    } catch (error) {
        showStatus(getError(error));
    }
}

function getAmount() {
    const value = amountInput.value.trim();

    if (!/^\d+(\.\d+)?$/.test(value)) {
        throw new Error("Please enter a valid ETH amount.");
    }

    const amount = ethers.parseEther(value);

    if (amount <= 0n) {
        throw new Error("Amount must be greater than zero.");
    }

    return amount;
}

async function deposit() {
    try {
        if (!contract) {
            showStatus("Please connect your wallet first.");
            return;
        }

        const amount = getAmount();

        showStatus("Waiting for MetaMask confirmation...");

        const tx = await contract.deposit({
            value: amount
        });

        showStatus("Transaction pending...");

        const receipt = await tx.wait();

        if (receipt.status !== 1) {
            throw new Error("Transaction failed.");
        }

        await checkBalance();
        showStatus("Deposit successful!");
        amountInput.value = "";
    } catch (error) {
        showStatus(getError(error));
    }
}

async function withdraw() {
    try {
        if (!contract) {
            showStatus("Please connect your wallet first.");
            return;
        }

        const amount = getAmount();
        const available = await contract.checkBalance();

        if (amount > available) {
            showStatus("Insufficient bank balance.");
            return;
        }

        showStatus("Waiting for MetaMask confirmation...");

        const tx = await contract.withdraw(amount);

        showStatus("Transaction pending...");

        const receipt = await tx.wait();

        if (receipt.status !== 1) {
            throw new Error("Transaction failed.");
        }

        await checkBalance();
        showStatus("Withdrawal successful!");
        amountInput.value = "";
    } catch (error) {
        showStatus(getError(error));
    }
}

connectBtn.addEventListener("click", connectWallet);
checkBtn.addEventListener("click", checkBalance);
depositBtn.addEventListener("click", deposit);
withdrawBtn.addEventListener("click", withdraw);

if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => {
        window.location.reload();
    });

    window.ethereum.on("chainChanged", () => {
        window.location.reload();
    });
}
