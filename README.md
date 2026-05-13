# 📋 User Guide & Platform Specification

> Setup, configuration, and operating instructions for the forensic evidence dApp.

---

## 📌 Table of Contents

- [Minimum Platform Specification](#-minimum-platform-specification)
- [Initial Environment Setup](#-initial-environment-setup)
  - [Step 1 – Installing MetaMask](#step-1--installing-metamask)
  - [Step 2 – Enabling the Sepolia Test Network](#step-2--enabling-the-sepolia-test-network)
  - [Step 3 – Obtaining Test ETH (Faucet)](#step-3--obtaining-test-eth-faucet)
- [Operating the Application](#-operating-the-application)

---

## 🖥️ Minimum Platform Specification

| Requirement | Details |
|-------------|---------|
| **Operating System** | Windows 10/11, macOS, or Linux |
| **Browser** | Google Chrome, Brave, or Firefox *(MetaMask extension support required)* |
| **Internet** | Stable connection for blockchain synchronisation |
| **Software** | MetaMask Browser Extension |

---

## ⚙️ Initial Environment Setup

### Step 1 – Installing MetaMask

1. Navigate to the official MetaMask website at [metamask.io](https://metamask.io) or the [Chrome Web Store](https://chrome.google.com/webstore).
2. Select **"Add to Chrome"** (or your respective browser) and confirm the installation.
3. Click **"Create a new wallet"** and follow the on-screen instructions to set up a password.
4. Securely store the **Secret Recovery Phrase**. For testing purposes, a dedicated development-only wallet is recommended.

> [!WARNING]
> **Never share your Secret Recovery Phrase with anyone.** Store it offline in a secure location. Your funds can be permanently lost if this phrase is compromised.

---

### Step 2 – Enabling the Sepolia Test Network

By default, MetaMask may hide test networks. To enable Sepolia:

1. Open the MetaMask extension and click the **Network Selector** button (top-left corner).
2. Toggle the switch labelled **"Show test networks"** to **ON**.
3. From the dropdown list, select **"Sepolia"**.

Your wallet interface should now reflect that you are connected to the **Sepolia Test Network**.

---

### Step 3 – Obtaining Test ETH (Faucet)

Transactions on the Sepolia network require **Gas Fees**, paid in Sepolia ETH. These have no real-world monetary value.

1. Visit a reputable faucet — such as one of the following:
   - [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
2. Copy your MetaMask wallet address by clicking your account name at the top of the extension.
3. Paste the address into the faucet's input field and complete the **"I am not a robot"** verification.
4. Click **"Send Me ETH"**.
5. Wait approximately **30–60 seconds** — your MetaMask balance should update to reflect the received test funds.

---

## 🚀 Operating the Application
| Role passwords : <br><br>
<img width="440" height="141" alt="image" src="https://github.com/user-attachments/assets/407680d8-afb4-4463-90aa-b370006a08d4" />


| # | Action | Description |
|---|--------|-------------|
| **1** | **Launch** | Access the application via the provided local or hosted URL. |
| **2** | **Connect** | Click the **"Connect Wallet"** button. MetaMask will prompt for a signature to link the wallet to the session. |
| **3** | **Upload** | Use the drag-and-drop interface to select a forensic file. Ensure the file does not exceed the size limits specified in the system design. |
| **4** | **Confirm** | Review the generated **SHA-256 hash** and click **"Confirm to Blockchain"**. |
| **5** | **Verify** | To check a file's integrity later, navigate to the **"Verify Evidence"** tab, upload the file again, and the system will cross-reference the live hash against the record stored on the Sepolia ledger. |

---


<img width="4000" height="3000" alt="V3Irsd7od" src="https://github.com/user-attachments/assets/61b8f004-7d40-4348-a10b-69a3d29e407f" />

