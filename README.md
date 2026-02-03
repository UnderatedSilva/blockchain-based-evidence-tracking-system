# 🔍 Forensic Chain: Blockchain-Based Evidence Tracking System

> **Securing Forensic Integrity & Immutable Chain of Custody**

This project is a decentralized web application designed to maintain a transparent, tamper-proof, and verifiable record of digital evidence. By combining **Ethereum Smart Contracts**, **IPFS**, and **SHA-256 Hashing**, it ensures that forensic evidence remains admissible in court by preventing unauthorized modifications and manual logging errors.

[Live Demo Link]([https://www.google.com/search?q=%23](https://blockchain-based-evidence-management-system.vercel.app/)) 

---

## ✨ Key Features

* 
**✅ Immutable Chain of Custody:** Every upload, transfer, and access event is permanently recorded on the Ethereum blockchain.


* **✅ Cryptographic Integrity Verification:** Uses **SHA-256** to create a unique digital fingerprint for every file. The system automatically detects if even a single bit of evidence has been altered.


* 
**✅ Decentralized Storage:** Actual evidence files are stored on **IPFS** (InterPlanetary File System), ensuring high availability and resilience against single points of failure.


* 
**✅ Role-Based Access Control (RBAC):** Distinct permissions for **Administrators**, **Forensic Investigators**, and **Auditors**.


* 
**✅ Automated Audit Trails:** Generates comprehensive, timestamped logs for forensic reporting and legal admissibility.



---

## 🛠️ Tech Stack

* 
**Frontend:** React.js + Vite (User-friendly Forensic Dashboard) 


* 
**Blockchain:** Solidity + Ethereum (Sepolia/Ganache Testnets) 


* 
**Storage:** IPFS (Distributed File Storage) 


* 
**Authentication:** MetaMask (Blockchain-based Identity) 


* 
**Library:** Ethers.js / Web3.js (Blockchain Interaction) 



---

## 🏃 Getting Started

### 1. Prerequisites

* **Node.js** installed
* **MetaMask** browser extension
* 
**Ganache** (for local blockchain testing) 



### 2. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/forensic-chain.git

# Enter the directory
cd forensic-chain

# Install dependencies
npm install

```

### 3. Setup Environment Variables

Create a `.env` file in the root directory:

```text
VITE_CONTRACT_ADDRESS=your_smart_contract_address
VITE_PINATA_JWT=your_ipfs_gateway_token

```

### 4. Run the App

```bash
npm run dev

```

---

## 📂 System Architecture

The system uses a layered architecture to separate concerns and maximize security:

1. 
**Application Layer:** React.js frontend for investigator interaction.


2. 
**Logic Layer:** Node.js/Web3.js for hashing and IPFS coordination.


3. 
**Blockchain Layer:** Solidity Smart Contracts for immutable record keeping.


4. 
**Storage Layer:** IPFS for secure, decentralized file retention.



---

## 📜 Academic Context

* 
**Degree:** BSc (Hons) Computer Security 


* 
**University:** University of Plymouth 


* 
**Supervisor:** Dr. Pabudi Abeyrathne 



---

## 🛡️ Security Disclaimer

This project is a functional prototype developed for academic evaluation and is not intended for use in real-world criminal investigations without further professional auditing.

---
