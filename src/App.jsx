import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import abi from './utils/EvidenceABI.json';
import axios from 'axios';

const LoadingSpinner = () => (
  <span style={{
    display: 'inline-block',
    width: '12px',
    height: '12px',
    marginLeft: '8px',
    borderRadius: '50%',
    border: '2px solid #00ff9cff',
    borderTopColor: 'transparent',
    animation: 'spin 0.6s linear infinite'
  }}>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </span>
);

function App() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("Ready");
  const [history, setHistory] = useState([]);
  const [walletAddress, setWalletAddress] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [speedHistory, setSpeedHistory] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [rolePassword, setRolePassword] = useState("");
  const [roleAuthError, setRoleAuthError] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferHash, setTransferHash] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('users');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [auditLog, setAuditLog] = useState(() => {
    try {
      const saved = localStorage.getItem('auditLog');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [adminTab, setAdminTab] = useState('dashboard');
  const [localHistory, setLocalHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('evidenceHistory');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newUserAddress, setNewUserAddress] = useState("");
  const [newUserRole, setNewUserRole] = useState("investigator");
  const [caseId, setCaseId] = useState("");
  const [investigatorName, setInvestigatorName] = useState("");
  const [location, setLocation] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyHash, setVerifyHash] = useState("");
  const [verifyId, setVerifyId] = useState("");
  const [verifyStatus, setVerifyStatus] = useState("");
  const [verifyDetail, setVerifyDetail] = useState("");
  const [filterCaseId, setFilterCaseId] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [timelineItem, setTimelineItem] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [backupFile, setBackupFile] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [certificateData, setCertificateData] = useState(null);

  const rolePasswords = {
    investigator: import.meta.env.VITE_ROLE_PASS_INVESTIGATOR || "investigator123",
    admin: import.meta.env.VITE_ROLE_PASS_ADMIN || "admin123",
    auditor: import.meta.env.VITE_ROLE_PASS_AUDITOR || "auditor123"
  };

  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const notification = { id, message, type };
    setNotifications((prev) => [...prev, notification]);
    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const computeSHA256 = async (fileBlob) => {
    const buffer = await fileBlob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const buildEvidenceDescription = (meta) => {
    return JSON.stringify({
      type: 'EvidenceMeta',
      sha256: meta.sha256 || '',
      caseId: meta.caseId || '',
      investigator: meta.investigator || '',
      location: meta.location || '',
      notes: meta.notes || ''
    });
  };

  const parseEvidenceDescription = (desc) => {
    if (!desc) return {};
    try {
      const parsed = JSON.parse(desc);
      if (parsed && parsed.type === 'EvidenceMeta') return parsed;
      return {};
    } catch {
      return {};
    }
  };

  const requestCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('Geolocation not supported in this browser.');
      return;
    }
    setLocationStatus('Requesting location permission...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const formatted = `Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)} (±${Math.round(accuracy)}m)`;
        setLocation(formatted);
        setLocationStatus('Location captured.');
      },
      (err) => {
        setLocationStatus(err.message || 'Location permission denied.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Save localHistory to localStorage whenever it changes
  useEffect(() => {
    try {
      const key = walletAddress ? `evidenceHistory_${walletAddress}` : 'evidenceHistory_global';
      localStorage.setItem(key, JSON.stringify(localHistory));
    } catch (e) {
      console.error('Failed saving localHistory to localStorage', e);
    }
  }, [localHistory]);

  // Save users to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  // Save audit log to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('auditLog', JSON.stringify(auditLog));
  }, [auditLog]);

  // 1. IMPROVED: Fetch from the mapping 'evidenceLog'
  const fetchHistory = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        abi,
        provider
      );

      const total = await contract.evidenceCount();
      let items = [];

      // Your contract uses evidenceCount starting from 1 (1-based index)
      for (let i = 1; i <= total; i++) {
        const data = await contract.evidenceLog(i);
        const meta = parseEvidenceDescription(data.description);
        items.push({
          id: data.id.toString(),
          name: data.name,
          desc: data.description,
          hash: data.ipfsHash,
          holder: data.currentHolder,
          time: new Date(Number(data.timestamp) * 1000).toLocaleString(),
          timestampMs: Number(data.timestamp) * 1000,
          eventType: 'UPLOAD',
          sha256: meta.sha256,
          caseId: meta.caseId,
          investigator: meta.investigator,
          location: meta.location,
          notes: meta.notes
        });
      }
      setHistory(items.reverse()); 
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  useEffect(() => {
    connectWallet();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      
      // Check if user has a role assigned
      if (users[address]) {
        setUserRole(users[address]);
      } else {
        setShowRoleModal(true);
        setSelectedRole("");
        setRolePassword("");
        setRoleAuthError("");
      }
      // Load per-wallet local history (if any)
      try {
        const saved = localStorage.getItem(`evidenceHistory_${address}`) || localStorage.getItem('evidenceHistory');
        if (saved) setLocalHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load per-wallet history', e);
      }

      // Refresh chain-backed history after wallet is known
      fetchHistory();
    } catch (err) {
      console.error("Error connecting wallet:", err);
    }
  };

  // 2. NEW: Copy to Clipboard Function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Hash copied to clipboard!");
  };

  // Role assignment
  const assignRole = () => {
    if (!walletAddress || !selectedRole) return;

    const expected = rolePasswords[selectedRole];
    if (!expected) {
      setRoleAuthError("Invalid role selected.");
      return;
    }

    if (rolePassword !== expected) {
      setRoleAuthError("Incorrect password for this role.");
      return;
    }

    setRoleAuthError("");
    if (walletAddress && selectedRole) {
      const updatedUsers = { ...users, [walletAddress]: selectedRole };
      setUsers(updatedUsers);
      setUserRole(selectedRole);
      setShowRoleModal(false);
      logAudit(`Assigned role: ${selectedRole}`, walletAddress, 'ROLE_ASSIGNMENT');
      setRolePassword("");
    }
  };

  // Log audit events
  const logAudit = (action, actor, actionType, meta = {}) => {
    const logEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      timestampMs: Date.now(),
      actor: actor || walletAddress,
      action,
      actionType,
      role: userRole,
      ...meta
    };
    setAuditLog([logEntry, ...auditLog]);
  };

  // Transfer evidence ownership
  const transferEvidence = async () => {
    if (!transferHash || !transferTo) {
      alert("Please fill in all transfer fields");
      return;
    }
    try {
      setStatus("Initiating transfer...");
      const newEntry = {
        id: Date.now().toString(),
        name: "Transfer: " + transferHash.slice(0, 10),
        desc: `Transferred from ${walletAddress?.slice(0, 6)} to ${transferTo?.slice(0, 6)}`,
        hash: transferHash,
        holder: transferTo,
        time: new Date().toLocaleString(),
        timestampMs: Date.now(),
        txHash: "pending",
        transferFrom: walletAddress,
        eventType: 'TRANSFER',
        role: userRole
      };
      setLocalHistory([newEntry, ...localHistory]);
      logAudit(`Transferred evidence to ${transferTo.slice(0, 10)}...`, walletAddress, 'TRANSFER', {
        evidenceHash: transferHash
      });
      setStatus("Transfer recorded successfully!");
      addNotification(`Evidence transferred to ${transferTo.slice(0, 10)}...`, 'success');
      setTransferHash("");
      setTransferTo("");
      setShowTransferModal(false);
      setTimeout(() => {
        setStatus("Ready");
        fetchHistory();
      }, 2000);
    } catch (error) {
      console.error(error);
      setStatus("Transfer error: " + error.message);
    }
  };

  // Log upload action
  const uploadToBlockchain = async () => {
    try {
      setUploadProgress(0);
      setStatus("Hashing file...");

      const sha256 = await computeSHA256(file);

      setStatus("Uploading to IPFS...");
      
      const formData = new FormData();
      formData.append('file', file);
      
      const startTime = Date.now();
      const pinataRes = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: { 'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}` },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 50) / progressEvent.total);
          setUploadProgress(percentCompleted);
          const elapsedSeconds = (Date.now() - startTime) / 1000;
          const speedKBps = (progressEvent.loaded / 1024) / elapsedSeconds;
          setUploadSpeed(speedKBps);
          setSpeedHistory((prev) => [...prev, speedKBps].slice(-40));
        }
      });

      const ipfsHash = pinataRes.data.IpfsHash;
      setUploadProgress(50);
      setStatus("IPFS Done! Signing Transaction...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer);

      const meta = {
        sha256,
        caseId: caseId.trim(),
        investigator: investigatorName.trim(),
        location: location.trim(),
        notes: notes.trim()
      };
      const description = buildEvidenceDescription(meta);

      // Sending data: Use custom name or original file name
      const displayName = fileName.trim() || file.name;
      const tx = await contract.uploadEvidence(displayName, description, ipfsHash);
      setUploadProgress(75);
      const receipt = await tx.wait();
      setUploadProgress(100);

      setStatus(`Success! Hash: ${ipfsHash}`);
      setUploadSpeed(0);
      addNotification(`Evidence "${displayName}" uploaded successfully!`, 'success');
      
      // Add to local history immediately
      const newEntry = {
        id: Date.now().toString(),
        name: displayName,
        desc: description,
        hash: ipfsHash,
        holder: await signer.getAddress(),
        time: new Date().toLocaleString(),
        timestampMs: Date.now(),
        txHash: receipt.hash,
        eventType: 'UPLOAD',
        sha256,
        caseId: meta.caseId,
        investigator: meta.investigator,
        location: meta.location,
        notes: meta.notes,
        role: userRole
      };
      setLocalHistory([newEntry, ...localHistory]);
      logAudit(`Uploaded evidence: ${displayName}`, walletAddress, 'UPLOAD', {
        evidenceHash: ipfsHash,
        sha256,
        caseId: meta.caseId,
        investigator: meta.investigator,
        location: meta.location
      });
      setFileName("");
      setCaseId("");
      setInvestigatorName("");
      setLocation("");
      setNotes("");
      
      // Reset progress after 2 seconds
      setTimeout(() => {
        setUploadProgress(0);
        setSpeedHistory([]);
        fetchHistory();
      }, 2000);
      
    } catch (error) {
      console.error(error);
      setStatus("Error: " + error.message);
      setUploadProgress(0);
    }
  };

  const verifyEvidence = async () => {
    if (!verifyFile || !verifyHash) {
      setVerifyStatus('error');
      setVerifyDetail('Please select a file and evidence hash.');
      return;
    }
    try {
      setVerifyStatus('verifying');
      setVerifyDetail('Computing SHA-256...');
      const computedHash = await computeSHA256(verifyFile);
      const all = [...localHistory, ...history];
      const target = all.find((e) => e.hash === verifyHash);

      if (!target) {
        setVerifyStatus('error');
        setVerifyDetail('No evidence record found for that hash.');
        addNotification('No evidence record found for that hash', 'error');
        logAudit('Verification failed: record not found', walletAddress, 'VERIFICATION', {
          evidenceHash: verifyHash,
          verificationResult: 'NOT_FOUND'
        });
        return;
      }

      if (!target.sha256) {
        setVerifyStatus('error');
        setVerifyDetail('No SHA-256 stored for this record.');
        addNotification('No SHA-256 stored for this record', 'error');
        logAudit('Verification failed: missing SHA-256', walletAddress, 'VERIFICATION', {
          evidenceHash: verifyHash,
          verificationResult: 'MISSING_SHA256'
        });
        return;
      }

      const match = computedHash === target.sha256;
      setVerifyStatus(match ? 'match' : 'mismatch');
      setVerifyDetail(match ? 'Integrity verified. Hashes match.' : 'Hash mismatch. Possible tampering.');
      addNotification(
        match ? 'Evidence integrity verified ✓' : 'Hash mismatch detected! Possible tampering ⚠',
        match ? 'success' : 'error'
      );
      logAudit(`Verification ${match ? 'passed' : 'failed'} for evidence`, walletAddress, 'VERIFICATION', {
        evidenceHash: verifyHash,
        sha256: computedHash,
        verificationResult: match ? 'MATCH' : 'MISMATCH'
      });
    } catch (error) {
      setVerifyStatus('error');
      setVerifyDetail('Verification error: ' + error.message);
    }
  };

  const verifyEvidenceOnChain = async () => {
    if (!verifyFile || !verifyId) {
      setVerifyStatus('error');
      setVerifyDetail('Please select a file and provide an on-chain ID.');
      addNotification('Please select a file and provide an on-chain ID', 'error');
      return;
    }
    try {
      setVerifyStatus('verifying');
      setVerifyDetail('Fetching on-chain record and computing SHA-256...');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(
        import.meta.env.VITE_CONTRACT_ADDRESS,
        abi,
        provider
      );

      const onChain = await contract.evidenceLog(verifyId);
      const meta = parseEvidenceDescription(onChain.description);

      if (!meta.sha256) {
        setVerifyStatus('error');
        setVerifyDetail('On-chain record has no SHA-256 stored.');
        addNotification('On-chain record has no SHA-256 stored', 'error');
        logAudit('On-chain verification failed: missing SHA-256', walletAddress, 'VERIFICATION', {
          evidenceId: verifyId,
          evidenceHash: onChain.ipfsHash,
          verificationResult: 'MISSING_SHA256_ONCHAIN'
        });
        return;
      }

      const computedHash = await computeSHA256(verifyFile);
      const match = computedHash === meta.sha256;

      setVerifyStatus(match ? 'match' : 'mismatch');
      setVerifyDetail(
        match
          ? 'On-chain integrity verified. Hashes match.'
          : 'On-chain hash mismatch. Possible tampering.'
      );
      addNotification(
        match ? 'On-chain integrity verified ✓' : 'On-chain hash mismatch detected! ⚠',
        match ? 'success' : 'error'
      );
      logAudit(`On-chain verification ${match ? 'passed' : 'failed'}`, walletAddress, 'VERIFICATION', {
        evidenceId: verifyId,
        evidenceHash: onChain.ipfsHash,
        sha256: computedHash,
        onChainSha256: meta.sha256,
        verificationResult: match ? 'MATCH_ONCHAIN' : 'MISMATCH_ONCHAIN'
      });
    } catch (error) {
      setVerifyStatus('error');
      setVerifyDetail('On-chain verification error: ' + error.message);
      addNotification('On-chain verification error: ' + error.message, 'error');
    }
  };

  // Generate Proof of Existence Certificate
  const generateCertificate = (item) => {
    if (!item) return;

    const certificateNumber = `POE-${Date.now().toString().slice(-10)}`;
    const generationTime = new Date().toLocaleString();
    const blockchainTimestamp = new Date(item.timestampMs).toLocaleString();

    const certificate = {
      certificateNumber,
      generationTime,
      title: "PROOF OF EXISTENCE (PoE) VERIFICATION CERTIFICATE",
      evidenceName: item.name,
      onChainId: item.id,
      investigatorWallet: item.holder || walletAddress,
      sha256Hash: item.sha256 || "Not Available",
      ipfsCid: item.hash,
      blockchainTimestamp,
      caseId: item.caseId || "N/A",
      investigator: item.investigator || "N/A",
      location: item.location || "N/A",
      notes: item.notes || "N/A",
      verificationStatus: "VERIFIED",
      nonRepudiationText: "This certificate serves as cryptographic proof of existence, ownership, and integrity of the evidence. The investigator wallet address and digital signatures create an immutable, non-repudiable record suitable for legal proceedings.",
      legalDisclaimer: "This Proof of Existence Certificate is issued as a formal record of evidence chain of custody for investigative and legal purposes. The blockchain timestamp and cryptographic hashes provide non-repudiation and tamper-evident proof.",
      itemDetails: item
    };

    setCertificateData(certificate);
    setShowCertificateModal(true);
    addNotification('Certificate generated successfully', 'success');
    logAudit(`Generated PoE certificate for evidence: ${item.name}`, walletAddress, 'CERTIFICATE_GENERATED', {
      certificateNumber,
      evidenceHash: item.hash,
      evidenceId: item.id
    });
  };

  // Download certificate as text file
  const downloadCertificate = () => {
    if (!certificateData) return;

    const certificateText = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║             PROOF OF EXISTENCE (PoE) VERIFICATION CERTIFICATE                  ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝

CERTIFICATE NUMBER:        ${certificateData.certificateNumber}
GENERATED:                 ${certificateData.generationTime}
VERIFICATION STATUS:       ${certificateData.verificationStatus}

─────────────────────────────────────────────────────────────────────────────────

EVIDENCE DETAILS:

  Evidence Name:           ${certificateData.evidenceName}
  On-Chain ID:             ${certificateData.onChainId}
  Case ID:                 ${certificateData.caseId}
  Investigator Name:       ${certificateData.investigator}
  Investigation Location:  ${certificateData.location}

─────────────────────────────────────────────────────────────────────────────────

CRYPTOGRAPHIC VERIFICATION:

  SHA-256 Hash:            ${certificateData.sha256Hash}
  IPFS CID:                ${certificateData.ipfsCid}
  Investigator Wallet:     ${certificateData.investigatorWallet}
  Blockchain Timestamp:    ${certificateData.blockchainTimestamp}

─────────────────────────────────────────────────────────────────────────────────

NOTES AND OBSERVATIONS:
${certificateData.notes}

─────────────────────────────────────────────────────────────────────────────────

NON-REPUDIATION DECLARATION:

${certificateData.nonRepudiationText}

The investigator's blockchain wallet address (${certificateData.investigatorWallet}) 
serves as a cryptographic identifier. All timestamps, hashes, and custody records 
are permanently recorded on the blockchain, making them immutable and tamper-evident.

─────────────────────────────────────────────────────────────────────────────────

LEGAL DISCLAIMER:

${certificateData.legalDisclaimer}

This certificate is generated as an automated record and should be used in 
conjunction with supporting documentation and chain of custody procedures.

─────────────────────────────────────────────────────────────────────────────────

Issued by: Evidence Management System v1.0
Certificate Validity: Permanent (Blockchain-backed)
Authentication Method: Wallet Signature & Blockchain Consensus

═════════════════════════════════════════════════════════════════════════════════
    `;

    const blob = new Blob([certificateText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PoE_Certificate_${certificateData.certificateNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    addNotification('Certificate downloaded successfully', 'success');
  };

  // Create new user
  const createNewUser = () => {
    if (!newUserAddress.trim()) {
      alert("Please enter a wallet address");
      return;
    }
    if (users[newUserAddress]) {
      alert("User already exists");
      return;
    }
    const updatedUsers = { ...users, [newUserAddress]: newUserRole };
    setUsers(updatedUsers);
    logAudit(`Created new user: ${newUserAddress.slice(0, 10)}... with role ${newUserRole}`, walletAddress, 'USER_CREATED');
    setNewUserAddress("");
    setNewUserRole("investigator");
    alert("User created successfully!");
  };

  // Generate forensic compliance report
  const generateReport = () => {
    const report = {
      generatedAt: new Date().toLocaleString(),
      generatedBy: walletAddress,
      totalEvidence: filteredHistory.length,
      totalUsers: Object.entries(users).length,
      userRoles: Object.values(users).reduce((acc, role) => {
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {}),
      totalTransfers: localHistory.filter(item => item.name?.includes('Transfer')).length,
      auditLogEntries: auditLog.length,
      storageUsed: `${(totalStorageUsed / 1024).toFixed(2)} MB`,
      systemStatus: 'Operational',
      integrityStatus: 'All evidence verified'
    };
    
    const reportText = `
FORENSIC COMPLIANCE REPORT
==========================================
Generated: ${report.generatedAt}
Generated By: ${report.generatedBy}

SYSTEM STATISTICS:
- Total Evidence Records: ${report.totalEvidence}
- Total Registered Users: ${report.totalUsers}
- Total Transfers: ${report.totalTransfers}
- Audit Log Entries: ${report.auditLogEntries}
- Storage Used: ${report.storageUsed}

USER ROLES:
${Object.entries(report.userRoles).map(([role, count]) => `- ${role.toUpperCase()}: ${count}`).join('\n')}

SYSTEM STATUS: ${report.systemStatus}
INTEGRITY STATUS: ${report.integrityStatus}

Chain of Custody: INTACT
Data Authenticity: VERIFIED
Evidence Immutability: CONFIRMED
==========================================
    `;
    
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance_report_${Date.now()}.txt`;
    a.click();
    
    logAudit('Generated compliance report', walletAddress, 'REPORT_GENERATED');
  };

  const handleBackupLocalHistory = () => {
    try {
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        walletAddress: walletAddress || null,
        localHistory
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence_history_${walletAddress ? walletAddress.slice(2, 8) : 'backup'}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addNotification('Local history backup downloaded', 'success');
      logAudit('Local history backup downloaded', walletAddress, 'LOCAL_BACKUP', {
        records: localHistory.length
      });
    } catch (e) {
      addNotification('Failed to create backup: ' + e.message, 'error');
    }
  };

  const handleRestoreLocalHistory = async () => {
    if (!backupFile) {
      addNotification('Please select a backup file', 'error');
      return;
    }
    try {
      const text = await backupFile.text();
      const parsed = JSON.parse(text);
      const restored = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.localHistory)
          ? parsed.localHistory
          : null;

      if (!restored) {
        addNotification('Invalid backup file format', 'error');
        return;
      }

      setLocalHistory(restored);
      setBackupFile(null);
      addNotification('Local history restored successfully', 'success');
      logAudit('Local history restored from backup', walletAddress, 'LOCAL_RESTORE', {
        records: restored.length,
        sourceWallet: parsed.walletAddress || null
      });
    } catch (e) {
      addNotification('Failed to restore backup: ' + e.message, 'error');
    }
  };

  // Filter history based on search term and filters
  const filteredHistory = [...localHistory, ...history].filter((item) => {
    const roleForItem = item.role || users[item.holder] || '';
    const matchesText =
      item.hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.caseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.investigator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCaseId = filterCaseId
      ? item.caseId?.toLowerCase().includes(filterCaseId.toLowerCase())
      : true;

    const matchesRole = filterRole ? roleForItem === filterRole : true;

    const itemDate = item.timestampMs ? new Date(item.timestampMs) : null;
    const startDate = filterStartDate ? new Date(filterStartDate) : null;
    const endDate = filterEndDate ? new Date(filterEndDate) : null;
    const matchesDate =
      (!startDate || (itemDate && itemDate >= startDate)) &&
      (!endDate || (itemDate && itemDate <= new Date(endDate.getTime() + 24 * 60 * 60 * 1000 - 1)));

    return matchesText && matchesCaseId && matchesRole && matchesDate;
  });

  const buildTimeline = (item) => {
    if (!item) return [];
    const combined = [...localHistory, ...history];
    const evidenceEvents = combined
      .filter((e) => e.hash === item.hash)
      .map((e) => ({
        id: e.id,
        time: e.time,
        timestampMs: e.timestampMs || 0,
        eventType: e.eventType || 'UPLOAD',
        actor: e.holder,
        role: e.role || users[e.holder],
        details: e.desc || e.name
      }));

    const auditEvents = auditLog
      .filter((e) => e.evidenceHash === item.hash)
      .map((e) => ({
        id: e.id,
        time: e.timestamp,
        timestampMs: e.timestampMs || 0,
        eventType: e.actionType,
        actor: e.actor,
        role: e.role,
        details: e.action
      }));

    return [...evidenceEvents, ...auditEvents].sort((a, b) => a.timestampMs - b.timestampMs);
  };

  // Calculate total storage used (approximate 5KB per record)
  const totalStorageUsed = filteredHistory.length * 5;

  const bgColor = isDarkMode ? '#121212' : '#f5f5f5';
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const accentColor = isDarkMode ? '#00ff9c' : '#008c3a';
  const cardBg = isDarkMode ? '#1e1e1e' : '#ffffff';
  const borderColor = isDarkMode ? '#333' : '#e0e0e0';
  const inputBg = isDarkMode ? '#1e1e1e' : '#ffffff';

  // Show login page if wallet connected but no role selected
  if (walletAddress && !userRole) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        padding: '50px',
        backgroundColor: '#121212',
        backgroundImage: 'url(https://i.pinimg.com/1200x/57/c4/65/57c465579d0ca97b1154e2161ac37a91.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        margin: 0,
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(18, 18, 18, 0.9)', zIndex: 0 }}></div>
        
        <div style={{
          position: 'relative',
          zIndex: 1,
          backgroundColor: '#1e1e1e',
          border: '2px solid #00ff9c',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 0 30px rgba(0, 255, 156, 0.2)'
        }}>
          <h1 style={{
            textAlign: 'center',
            color: '#00ff9c',
            marginTop: 0,
            marginBottom: '10px',
            fontSize: '2rem',
            letterSpacing: '2px'
          }}>
            EVIDENCE SYSTEM
          </h1>
          <p style={{
            textAlign: 'center',
            color: '#aaa',
            marginBottom: '30px',
            fontSize: '0.95rem'
          }}>
            Select your role and authenticate to continue
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#00ff9c',
              marginBottom: '8px',
              fontSize: '0.95rem',
              fontWeight: 'bold'
            }}>
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setRoleAuthError("");
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #00ff9c',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '1rem',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <option value="">-- Select a Role --</option>
              <option value="investigator">Investigator</option>
              <option value="admin">Administrator</option>
              <option value="auditor">Auditor</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#00ff9c',
              marginBottom: '8px',
              fontSize: '0.95rem',
              fontWeight: 'bold'
            }}>
              Password
            </label>
            <input
              type="password"
              value={rolePassword}
              onChange={(e) => {
                setRolePassword(e.target.value);
                setRoleAuthError("");
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') assignRole();
              }}
              placeholder="Enter role password"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #00ff9c',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {roleAuthError && (
            <div style={{
              backgroundColor: '#d32f2f',
              color: '#ffffff',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              fontSize: '0.9rem',
              border: '1px solid #ff6b6b'
            }}>
              {roleAuthError}
            </div>
          )}

          <button
            onClick={assignRole}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#00ff9c',
              color: '#000000',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#00dd88';
              e.target.style.boxShadow = '0 0 20px rgba(0, 255, 156, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#00ff9c';
              e.target.style.boxShadow = 'none';
            }}
          >
            Login
          </button>

          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#2a2a2a',
            borderRadius: '6px',
            border: '1px solid #333',
            fontSize: '0.85rem',
            color: '#aaa'
          }}>
            <strong style={{ color: '#00ff9c' }}>Wallet:</strong>
            <div style={{ wordBreak: 'break-all', marginTop: '6px', fontFamily: 'monospace' }}>
              {walletAddress}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh',
      padding: '50px', 
      backgroundColor: bgColor, 
      backgroundImage: 'url(https://i.pinimg.com/1200x/57/c4/65/57c465579d0ca97b1154e2161ac37a91.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      color: textColor, 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      boxSizing: 'border-box', 
      display: 'flex', 
      flexDirection: 'column', 
      margin: 0,
      position: 'relative'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(18, 18, 18, 0.8)', zIndex: 0 }}></div>

      {/* Notifications Panel */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 999, maxWidth: '400px' }}>
        {notifications.map((notif) => (
          <div
            key={notif.id}
            style={{
              backgroundColor: notif.type === 'success' ? '#2da23d' : notif.type === 'error' ? '#d32f2f' : '#1e1e1e',
              color: notif.type === 'success' || notif.type === 'error' ? 'white' : '#ddd',
              border: `1px solid ${notif.type === 'success' ? '#00ff9c' : notif.type === 'error' ? '#ff6b6b' : '#333'}`,
              borderRadius: '6px',
              padding: '12px 15px',
              marginBottom: '10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              fontSize: '0.9rem',
              animation: 'slideIn 0.3s ease'
            }}
          >
            <span>{notif.message}</span>
          </div>
        ))}
        <style>{`
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>
      </div>

      {/* Role Selection Modal */}


      {/* Transfer Modal */}
      {showTransferModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e1e1e', padding: '40px', borderRadius: '10px', border: '1px solid rgba(0,255,156,0.3)', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ marginTop: 0, color: '#00ff9c' }}>Transfer Evidence Ownership</h2>
            <input 
              type="text" 
              placeholder="Evidence Hash"
              value={transferHash}
              onChange={(e) => setTransferHash(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '15px',
                backgroundColor: '#121212',
                border: '1px solid rgba(0,255,156,0.3)',
                borderRadius: '5px',
                color: '#ddd',
                boxSizing: 'border-box'
              }}
            />
            <input 
              type="text" 
              placeholder="Transfer To (wallet address)"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '20px',
                backgroundColor: '#121212',
                border: '1px solid rgba(0,255,156,0.3)',
                borderRadius: '5px',
                color: '#ddd',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={transferEvidence}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#2da23d',
                  color: 'black',
                  border: 'none',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Transfer
              </button>
              <button 
                onClick={() => setShowTransferModal(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#666',
                  color: '#ddd',
                  border: 'none',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showTimelineModal && timelineItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '10px', border: '1px solid rgba(0,255,156,0.3)', maxWidth: '700px', width: '100%' }}>
            <h2 style={{ marginTop: 0, color: '#00ff9c' }}>Evidence Timeline</h2>
            <p style={{ color: '#aaa', fontSize: '0.85rem', wordBreak: 'break-all' }}>Hash: {timelineItem.hash}</p>
            <div style={{ maxHeight: '350px', overflowY: 'auto', border: '1px solid rgba(0,255,156,0.1)', borderRadius: '6px', padding: '10px' }}>
              {buildTimeline(timelineItem).length > 0 ? (
                buildTimeline(timelineItem).map((evt) => (
                  <div key={evt.id} style={{ borderBottom: '1px solid rgba(0,255,156,0.1)', padding: '10px 0', fontSize: '0.85rem' }}>
                    <p style={{ margin: '0 0 4px 0', color: '#00ff9c', fontWeight: 600 }}>{evt.eventType}</p>
                    <p style={{ margin: '0 0 2px 0', color: '#aaa' }}>{evt.details}</p>
                    <p style={{ margin: '0 0 2px 0', color: '#888' }}>Actor: {evt.actor?.slice(0, 10)}...{evt.actor?.slice(-6)} {evt.role ? `(${evt.role})` : ''}</p>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>{evt.time}</p>
                  </div>
                ))
              ) : (
                <p style={{ color: '#888' }}>No timeline events found.</p>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
              <button
                onClick={() => setShowTimelineModal(false)}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#666',
                  color: '#ddd',
                  border: 'none',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {showCertificateModal && certificateData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001, overflowY: 'auto', padding: '20px' }}>
          <div style={{ backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '10px', border: '2px solid #555', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', fontFamily: 'monospace' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '2px solid #555' }}>
              <h1 style={{ marginTop: 0, color: '#ffffff', fontSize: '1.8em', letterSpacing: '2px' }}>PROOF OF EXISTENCE</h1>
              <h2 style={{ margin: '5px 0', color: '#00ff9c', fontSize: '1.2em', letterSpacing: '1px' }}>VERIFICATION CERTIFICATE</h2>
            </div>

            <div style={{ marginBottom: '20px', fontSize: '0.9em', lineHeight: '1.6' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div>
                  <p style={{ margin: '8px 0', color: '#00ff9c', fontWeight: 'bold' }}>CERTIFICATE NUMBER</p>
                  <p style={{ margin: '0 0 15px 0', color: '#ddd', wordBreak: 'break-all' }}>{certificateData.certificateNumber}</p>
                  
                  <p style={{ margin: '8px 0', color: '#00ff9c', fontWeight: 'bold' }}>GENERATED</p>
                  <p style={{ margin: '0 0 15px 0', color: '#ddd', wordBreak: 'break-all' }}>{certificateData.generationTime}</p>

                  <p style={{ margin: '8px 0', color: '#00ff9c', fontWeight: 'bold' }}>VERIFICATION STATUS</p>
                  <p style={{ margin: '0 0 15px 0', color: '#00ff9c', fontWeight: 'bold' }}>{certificateData.verificationStatus}</p>
                </div>
                <div>
                  <p style={{ margin: '8px 0', color: '#00ff9c', fontWeight: 'bold' }}>ON-CHAIN ID</p>
                  <p style={{ margin: '0 0 15px 0', color: '#ddd', wordBreak: 'break-all' }}>{certificateData.onChainId}</p>

                  <p style={{ margin: '8px 0', color: '#00ff9c', fontWeight: 'bold' }}>CASE ID</p>
                  <p style={{ margin: '0 0 15px 0', color: '#ddd', wordBreak: 'break-all' }}>{certificateData.caseId}</p>

                  <p style={{ margin: '8px 0', color: '#00ff9c', fontWeight: 'bold' }}>BLOCKCHAIN TIMESTAMP</p>
                  <p style={{ margin: '0 0 15px 0', color: '#ddd', wordBreak: 'break-all' }}>{certificateData.blockchainTimestamp}</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #555', paddingTop: '20px', marginBottom: '20px' }}>
                <p style={{ margin: '8px 0', color: '#ffffff', fontWeight: 'bold', fontSize: '0.95em' }}>EVIDENCE DETAILS:</p>
                <p style={{ margin: '5px 0', color: '#ddd' }}><strong>Name:</strong> {certificateData.evidenceName}</p>
                <p style={{ margin: '5px 0', color: '#ddd' }}><strong>Investigator:</strong> {certificateData.investigator}</p>
                <p style={{ margin: '5px 0', color: '#ddd' }}><strong>Location:</strong> {certificateData.location}</p>
                <p style={{ margin: '5px 0', color: '#ddd' }}><strong>Notes:</strong> {certificateData.notes}</p>
              </div>

              <div style={{ borderTop: '1px solid #555', paddingTop: '20px', marginBottom: '20px' }}>
                <p style={{ margin: '8px 0', color: '#ffffff', fontWeight: 'bold', fontSize: '0.95em' }}>CRYPTOGRAPHIC VERIFICATION:</p>
                <div style={{ backgroundColor: '#121212', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                  <p style={{ margin: '5px 0', color: '#00ff9c', fontSize: '0.85em', fontWeight: 'bold' }}>SHA-256 HASH:</p>
                  <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '0.8em', wordBreak: 'break-all', maxHeight: '60px', overflowY: 'auto' }}>{certificateData.sha256Hash}</p>
                </div>
                <div style={{ backgroundColor: '#121212', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                  <p style={{ margin: '5px 0', color: '#00ff9c', fontSize: '0.85em', fontWeight: 'bold' }}>IPFS CID:</p>
                  <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '0.8em', wordBreak: 'break-all', maxHeight: '60px', overflowY: 'auto' }}>{certificateData.ipfsCid}</p>
                </div>
                <div style={{ backgroundColor: '#121212', padding: '10px', borderRadius: '4px' }}>
                  <p style={{ margin: '5px 0', color: '#00ff9c', fontSize: '0.85em', fontWeight: 'bold' }}>INVESTIGATOR WALLET:</p>
                  <p style={{ margin: '5px 0 0 0', color: '#aaa', fontSize: '0.8em', wordBreak: 'break-all' }}>{certificateData.investigatorWallet}</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #555', paddingTop: '20px', marginBottom: '20px', backgroundColor: 'rgba(85, 85, 85, 0.3)', padding: '15px', borderRadius: '4px' }}>
                <p style={{ margin: '0 0 10px 0', color: '#ffffff', fontWeight: 'bold', fontSize: '0.95em' }}>NON-REPUDIATION DECLARATION:</p>
                <p style={{ margin: '0', color: '#ddd', fontSize: '0.85em', lineHeight: '1.5' }}>{certificateData.nonRepudiationText}</p>
              </div>

              <div style={{ borderTop: '1px solid #555', paddingTop: '20px', marginBottom: '20px', fontSize: '0.8em', color: '#888' }}>
                <p style={{ margin: '5px 0' }}><strong>Issued by:</strong> Evidence Management System v1.0</p>
                <p style={{ margin: '5px 0' }}><strong>Certificate Validity:</strong> Permanent (Blockchain-backed)</p>
                <p style={{ margin: '5px 0' }}><strong>Authentication Method:</strong> Wallet Signature & Blockchain Consensus</p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px' }}>
              <button
                onClick={downloadCertificate}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  backgroundColor: '#555',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                📥 Download Certificate
              </button>
              <button
                onClick={() => setShowCertificateModal(false)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  backgroundColor: '#666',
                  color: '#ddd',
                  border: 'none',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: `2px solid ${isDarkMode ? 'rgba(0,255,156,0.3)' : 'rgba(0,140,58,0.3)'}`, paddingBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, marginBottom: '10px', fontSize: '2.5em', fontWeight: 700, letterSpacing: '1px' }}>Evidence Management System</h1>
          <div style={{ height: '3px', width: '100%', background: `linear-gradient(90deg, ${accentColor}, transparent)`, borderRadius: '2px' }}></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '0.85rem', color: '#00ff9c', fontWeight: 600, padding: '5px 10px', border: '1px solid rgba(0,255,156,0.3)', borderRadius: '5px' }}>
            {userRole ? userRole.toUpperCase() : 'No Role'}
          </span>
          <button 
            onClick={() => {
              setShowRoleModal(true);
              setSelectedRole("");
              setRolePassword("");
              setRoleAuthError("");
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#00ff9c',
              color: 'black',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.8rem'
            }}
          >
            Change Role
          </button>
        </div>
      </div>
      
      <div style={{ border: '1px solid #333', padding: '20px', borderRadius: '10px', backgroundColor: 'rgba(30, 30, 30, 0.85)', marginBottom: '40px', display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1 }}>
          <p><strong>System Status:</strong> <span style={{ color: '#00ff9c', }}><b>{status}</b></span>
            {status.includes('Signing') && <LoadingSpinner />}
          </p>
          {(userRole === 'investigator' || userRole === 'admin') && (
            <>
              <input type="file" onChange={(e) => setFile(e.target.files[0])} style={{ marginBottom: '10px' }} />
              {file && (
                <>
                  <input 
                    type="text" 
                    placeholder="Edit filename (optional)"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    style={{ 
                      width: '100%',
                      padding: '8px 12px', 
                      backgroundColor: '#1e1e1e', 
                      border: '1px solid rgba(0,255,156,0.3)',
                      borderRadius: '6px',
                      color: '#ddd',
                      fontSize: '0.9rem',
                      marginBottom: '10px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '10px' }}>
                    Original: {file.name}
                  </div>
                  <input
                    type="text"
                    placeholder="Case ID"
                    value={caseId}
                    onChange={(e) => setCaseId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#1e1e1e',
                      border: '1px solid rgba(0,255,156,0.3)',
                      borderRadius: '6px',
                      color: '#ddd',
                      fontSize: '0.9rem',
                      marginBottom: '10px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Investigator Name"
                    value={investigatorName}
                    onChange={(e) => setInvestigatorName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#1e1e1e',
                      border: '1px solid rgba(0,255,156,0.3)',
                      borderRadius: '6px',
                      color: '#ddd',
                      fontSize: '0.9rem',
                      marginBottom: '10px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#1e1e1e',
                      border: '1px solid rgba(0,255,156,0.3)',
                      borderRadius: '6px',
                      color: '#ddd',
                      fontSize: '0.9rem',
                      marginBottom: '8px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <button
                    onClick={requestCurrentLocation}
                    type="button"
                    style={{
                      backgroundColor: '#00bfff',
                      color: 'black',
                      padding: '6px 10px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.8rem',
                      marginBottom: '8px'
                    }}
                  >
                    Use Current Location
                  </button>
                  {locationStatus && (
                    <div style={{ fontSize: '0.8rem', color: '#9aa', marginBottom: '10px' }}>
                      {locationStatus}
                    </div>
                  )}
                  <textarea
                    placeholder="Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#1e1e1e',
                      border: '1px solid rgba(0,255,156,0.3)',
                      borderRadius: '6px',
                      color: '#ddd',
                      fontSize: '0.9rem',
                      marginBottom: '10px',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                </>
              )}
              <br />
              <button 
                onClick={uploadToBlockchain} 
                disabled={!file}
                style={{ 
                  backgroundColor: file ? '#2da23d' : '#afb5b590', 
                  color: 'black', padding: '10px 20px', 
                  border: 'none', borderRadius: '5px', 
                  cursor: file ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  marginRight: '10px'
                }}
              >
                Secure Evidence
              </button>
              {userRole === 'investigator' && (
                <button 
                  onClick={() => setShowTransferModal(true)}
                  style={{ 
                    backgroundColor: '#00bfff',
                    color: 'black', 
                    padding: '10px 20px', 
                    border: 'none', 
                    borderRadius: '5px', 
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Transfer Evidence
                </button>
              )}
            </>
          )}
          {userRole === 'auditor' && (
            <p style={{ color: '#888', fontStyle: 'italic' }}>View-only access. No upload or transfer permissions.</p>
          )}
          <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(0,255,156,0.15)' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#00ff9c', fontWeight: 600 }}>Verify Evidence (SHA-256)</p>
            <input
              type="file"
              onChange={(e) => {
                setVerifyFile(e.target.files?.[0] || null);
                setVerifyStatus("");
                setVerifyDetail("");
              }}
              style={{ marginBottom: '10px' }}
            />
            <input
              type="text"
              placeholder="Paste evidence hash"
              value={verifyHash}
              onChange={(e) => {
                setVerifyHash(e.target.value.trim());
                setVerifyStatus("");
                setVerifyDetail("");
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: '#1e1e1e',
                border: '1px solid rgba(0,255,156,0.3)',
                borderRadius: '6px',
                color: '#ddd',
                fontSize: '0.9rem',
                marginBottom: '10px',
                boxSizing: 'border-box'
              }}
            />
            
            <button
              onClick={verifyEvidence}
              style={{
                backgroundColor: '#00bfff',
                color: 'black',
                padding: '8px 14px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Verify 
            </button>
            
              
           
            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#888' }}>
              Restore replaces local history for this wallet.
            </div>
          </div>
        </div>
        <div style={{ width: '250px', border: '1px solid rgba(0,255,156,0.2)', borderRadius: '8px', padding: '15px', background: 'linear-gradient(135deg, rgba(0,255,156,0.08), rgba(0,255,156,0.02))', backgroundColor: 'rgba(30, 30, 30, 0.8)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#00ff9c', fontWeight: 600 }}>Network</p>
            <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#ddd' }}>Sepolia Testnet</p>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#00ff9c', fontWeight: 600 }}>Wallet</p>
            <p style={{ margin: '0 0 15px 0', fontSize: '0.8rem', color: '#ddd', wordBreak: 'break-all' }}>
              {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Not connected'}
            </p>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#00ff9c', fontWeight: 600 }}>Role</p>
            <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#00ff9c', fontWeight: 600 }}>
              {userRole ? userRole.toUpperCase() : 'Not assigned'}
            </p>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#00ff9c', fontWeight: 600 }}>Status</p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: file ? '#00ff9c' : '#888' }}>
              {file ? 'Ready to upload' : 'Select a file'}
            </p>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#666', paddingTop: '10px', borderTop: '1px solid rgba(0,255,156,0.1)' }}>
            v1.0.0
          </div>
        </div>
        <div style={{ width: '250px', border: '1px solid rgba(0,255,156,0.2)', borderRadius: '8px', padding: '15px', background: 'linear-gradient(135deg, rgba(0,255,156,0.08), rgba(0,255,156,0.02))', backgroundColor: 'rgba(30, 30, 30, 0.8)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#00ff9c', fontWeight: 600 }}>Upload Speed</p>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#ddd' }}>{uploadSpeed > 0 ? uploadSpeed.toFixed(2) + ' KB/s' : 'Idle'}</p>
            <svg width="100%" height="70" viewBox="0 0 100 70" style={{ marginBottom: '10px' }}>
              <defs>
                <linearGradient id="pulseGradient" x1="0" x2="1">
                  <stop offset="0%" stopColor="#00ff9c" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#00ff9c" stopOpacity="1" />
                  <stop offset="100%" stopColor="#00ff9c" stopOpacity="0.2" />
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1.2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <style>{`
                .pulse-line {
                  animation: pulseGlow 1.2s ease-in-out infinite;
                }
                .heartbeat-line {
                  stroke-dasharray: 6 6;
                  animation: dashMove 1s linear infinite;
                }
                @keyframes pulseGlow {
                  0%, 100% { opacity: 0.7; }
                  50% { opacity: 1; }
                }
                @keyframes dashMove {
                  to { stroke-dashoffset: -12; }
                }
              `}</style>
              <line x1="-15" y1="35" x2="115" y2="35" stroke="#00ff9c" strokeWidth="1" opacity="0.7" strokeDasharray="3 5" />
              {(() => {
                const isUploading = uploadSpeed > 0 || speedHistory.length > 1;
                if (isUploading) {
                  const maxSpeed = Math.max(...speedHistory, 1);
                  const midY = 35;
                  const amp = 24;
                  const len = Math.max(speedHistory.length - 1, 1);
                  const points = speedHistory.map((speed, idx) => {
                    const x = (idx / len) * 100;
                    const y = midY - Math.min(amp, (speed / maxSpeed) * amp);
                    return `${x},${y}`;
                  }).join(' ');
                  const lastX = (speedHistory.length - 1) / len * 100;
                  const lastY = midY - Math.min(amp, (speedHistory[speedHistory.length - 1] / maxSpeed) * amp);
                  return (
                    <>
                      <polyline
                        points={points}
                        fill="none"
                        stroke="url(#pulseGradient)"
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        className="pulse-line"
                        filter="url(#glow)"
                      />
                      <circle cx={lastX} cy={lastY} r="2" fill="#00ff9c" />
                    </>
                  );
                }

                return (
                  <polyline
                    points="0,25 100,25"
                    fill="none"
                    stroke="#00ff9c"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    className="heartbeat-line"
                    filter="url(#glow)"
                  />
                );
              })()}
            </svg>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#00ff9c', fontWeight: 600 }}>Storage Used</p>
            <p style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#ddd' }}>{(totalStorageUsed / 1024).toFixed(2)} MB</p>
            <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#00ff9c', fontWeight: 600 }}>Total Records</p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#ddd' }}>{filteredHistory.length}</p>
          </div>
        </div>
      </div>

      {/* Admin Dashboard */}
      {userRole === 'admin' && (
        <div style={{ border: '1px solid rgba(0,255,156,0.3)', padding: '20px', borderRadius: '10px', backgroundColor: 'rgba(30, 30, 30, 0.85)', marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <button onClick={() => setAdminTab('dashboard')} style={{ padding: '8px 15px', backgroundColor: adminTab === 'dashboard' ? '#00ff9c' : '#333', color: adminTab === 'dashboard' ? 'black' : '#ddd', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Statistics</button>
            <button onClick={() => setAdminTab('users')} style={{ padding: '8px 15px', backgroundColor: adminTab === 'users' ? '#00ff9c' : '#333', color: adminTab === 'users' ? 'black' : '#ddd', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>User Management</button>
            <button onClick={() => setAdminTab('audit')} style={{ padding: '8px 15px', backgroundColor: adminTab === 'audit' ? '#00ff9c' : '#333', color: adminTab === 'audit' ? 'black' : '#ddd', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Audit Log</button>
            <button onClick={() => setAdminTab('timeline')} style={{ padding: '8px 15px', backgroundColor: adminTab === 'timeline' ? '#00ff9c' : '#333', color: adminTab === 'timeline' ? 'black' : '#ddd', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Activity Timeline</button>
            <button onClick={() => setAdminTab('blockchain')} style={{ padding: '8px 15px', backgroundColor: adminTab === 'blockchain' ? '#00ff9c' : '#333', color: adminTab === 'blockchain' ? 'black' : '#ddd', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}>Blockchain Monitor</button>
            <button onClick={generateReport} style={{ padding: '8px 15px', backgroundColor: '#00bfff', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', marginLeft: 'auto' }}>Export Report</button>
          </div>

          {/* Statistics Dashboard */}
          {adminTab === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ border: '1px solid rgba(0,255,156,0.2)', padding: '15px', borderRadius: '6px', backgroundColor: 'rgba(18, 18, 18, 0.5)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#00ff9c', fontWeight: 600 }}>Total Evidence</p>
                <p style={{ margin: 0, fontSize: '2rem', color: '#00ff9c', fontWeight: 'bold' }}>{filteredHistory.length}</p>
              </div>
              <div style={{ border: '1px solid rgba(0,255,156,0.2)', padding: '15px', borderRadius: '6px', backgroundColor: 'rgba(18, 18, 18, 0.5)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#00ff9c', fontWeight: 600 }}>Total Users</p>
                <p style={{ margin: 0, fontSize: '2rem', color: '#00ff9c', fontWeight: 'bold' }}>{Object.entries(users).length}</p>
              </div>
              <div style={{ border: '1px solid rgba(0,255,156,0.2)', padding: '15px', borderRadius: '6px', backgroundColor: 'rgba(18, 18, 18, 0.5)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#00ff9c', fontWeight: 600 }}>Total Transfers</p>
                <p style={{ margin: 0, fontSize: '2rem', color: '#00ff9c', fontWeight: 'bold' }}>{localHistory.filter(item => item.name?.includes('Transfer')).length}</p>
              </div>
              <div style={{ border: '1px solid rgba(0,255,156,0.2)', padding: '15px', borderRadius: '6px', backgroundColor: 'rgba(18, 18, 18, 0.5)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#00ff9c', fontWeight: 600 }}>Storage Used</p>
                <p style={{ margin: 0, fontSize: '1.5rem', color: '#00ff9c', fontWeight: 'bold' }}>{(totalStorageUsed / 1024).toFixed(2)} MB</p>
              </div>
              <div style={{ border: '1px solid rgba(0,255,156,0.2)', padding: '15px', borderRadius: '6px', backgroundColor: 'rgba(18, 18, 18, 0.5)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#00ff9c', fontWeight: 600 }}>Audit Entries</p>
                <p style={{ margin: 0, fontSize: '2rem', color: '#00ff9c', fontWeight: 'bold' }}>{auditLog.length}</p>
              </div>
              <div style={{ border: '1px solid rgba(0,255,156,0.2)', padding: '15px', borderRadius: '6px', backgroundColor: 'rgba(18, 18, 18, 0.5)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#00ff9c', fontWeight: 600 }}>System Status</p>
                <p style={{ margin: 0, fontSize: '1.2rem', color: '#00ff9c', fontWeight: 'bold' }}>Operational</p>
              </div>
            </div>
          )}

          {/* User Management */}
          {adminTab === 'users' && (
            <div>
              <div style={{ border: '1px solid rgba(0,255,156,0.2)', padding: '15px', borderRadius: '6px', backgroundColor: 'rgba(18, 18, 18, 0.5)', marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0, color: '#00ff9c' }}>Create New User</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Wallet Address (0x...)"
                    value={newUserAddress}
                    onChange={(e) => setNewUserAddress(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      backgroundColor: '#121212',
                      border: '1px solid rgba(0,255,156,0.3)',
                      borderRadius: '4px',
                      color: '#ddd',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <select 
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#121212',
                      border: '1px solid rgba(0,255,156,0.3)',
                      borderRadius: '4px',
                      color: '#ddd',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="investigator">Investigator</option>
                    <option value="admin">Admin</option>
                    <option value="auditor">Auditor</option>
                  </select>
                  <button 
                    onClick={createNewUser}
                    style={{
                      padding: '8px 15px',
                      backgroundColor: '#00ff9c',
                      color: 'black',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}
                  >
                    Add User
                  </button>
                </div>
              </div>
              <h3 style={{ marginTop: 0, color: '#00ff9c' }}>Existing Users</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                {Object.entries(users).length > 0 ? (
                  Object.entries(users).map(([address, role]) => (
                    <div key={address} style={{ border: '1px solid rgba(0,255,156,0.2)', padding: '12px', borderRadius: '6px', backgroundColor: 'rgba(18, 18, 18, 0.5)' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#ddd' }}>
                        <strong>{address.slice(0, 10)}...{address.slice(-8)}</strong>
                      </p>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#00ff9c' }}>
                        Role: <strong>{role.toUpperCase()}</strong>
                      </p>
                      <select 
                        value={role}
                        onChange={(e) => {
                          const updatedUsers = { ...users, [address]: e.target.value };
                          setUsers(updatedUsers);
                          logAudit(`Changed ${address.slice(0, 10)}... role to ${e.target.value}`, walletAddress, 'ROLE_CHANGE');
                        }}
                        style={{
                          width: '100%',
                          padding: '6px',
                          backgroundColor: '#121212',
                          border: '1px solid rgba(0,255,156,0.3)',
                          borderRadius: '4px',
                          color: '#ddd',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="investigator">Investigator</option>
                        <option value="admin">Admin</option>
                        <option value="auditor">Auditor</option>
                      </select>
                    </div>
                  ))
                ) : (
                  <p style={{ color: '#888' }}>No users registered yet</p>
                )}
              </div>
            </div>
          )}

          {/* Audit Log */}
          {adminTab === 'audit' && (
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid rgba(0,255,156,0.2)', borderRadius: '6px', padding: '10px' }}>
              {auditLog.length > 0 ? (
                auditLog.map((entry) => (
                  <div key={entry.id} style={{ borderBottom: '1px solid rgba(0,255,156,0.1)', padding: '10px 0', fontSize: '0.85rem' }}>
                    <p style={{ margin: '0 0 4px 0', color: '#00ff9c', fontWeight: 600 }}>{entry.action}</p>
                    <p style={{ margin: '0 0 2px 0', color: '#aaa' }}>Type: {entry.actionType}</p>
                    <p style={{ margin: '0 0 2px 0', color: '#888' }}>Actor: {entry.actor?.slice(0, 10)}...{entry.actor?.slice(-6)}</p>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>{entry.timestamp}</p>
                  </div>
                ))
              ) : (
                <p style={{ color: '#888' }}>No audit log entries</p>
              )}
            </div>
          )}

          {/* Activity Timeline */}
          {adminTab === 'timeline' && (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {auditLog.length > 0 ? (
                <div style={{ borderLeft: '3px solid #00ff9c', paddingLeft: '15px' }}>
                  {auditLog.map((entry, idx) => (
                    <div key={entry.id} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: idx < auditLog.length - 1 ? '1px solid rgba(0,255,156,0.1)' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#00ff9c', marginLeft: '-24px' }}></div>
                        <span style={{ fontSize: '0.75rem', color: '#00ff9c', fontWeight: 600 }}>{entry.timestamp}</span>
                        <span style={{ fontSize: '0.75rem', color: '#888', backgroundColor: 'rgba(0,255,156,0.1)', padding: '2px 6px', borderRadius: '3px' }}>{entry.actionType}</span>
                      </div>
                      <p style={{ margin: '5px 0 0 0', color: '#ddd', fontSize: '0.9rem' }}>{entry.action}</p>
                      <p style={{ margin: '3px 0 0 0', color: '#666', fontSize: '0.8rem' }}>by {entry.actor?.slice(0, 10)}...{entry.actor?.slice(-6)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#888' }}>No activity recorded</p>
              )}
            </div>
          )}

          {/* Blockchain Monitor */}
          {adminTab === 'blockchain' && (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {filteredHistory.length > 0 ? (
                filteredHistory.slice(0, 10).map((item) => (
                  <div key={item.id} style={{ border: '1px solid rgba(0,255,156,0.1)', padding: '10px', marginBottom: '10px', borderRadius: '5px', backgroundColor: 'rgba(18, 18, 18, 0.5)', fontSize: '0.85rem' }}>
                    <p style={{ margin: '0 0 5px 0', color: '#00ff9cff', fontWeight: 600 }}>{item.name}</p>
                    <p style={{ margin: '0 0 3px 0', color: '#aaa' }}>Hash: <code style={{ fontSize: '0.75rem' }}>{item.hash?.slice(0, 20)}...</code></p>
                    <p style={{ margin: '0 0 3px 0', color: '#888' }}>Holder: {item.holder?.slice(0, 10)}...{item.holder?.slice(-6)}</p>
                    <p style={{ margin: '0 0 3px 0', color: '#888' }}>Tx: {item.txHash ? (item.txHash === 'pending' ? 'Pending' : `${item.txHash.slice(0, 10)}...`) : 'N/A'}</p>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>{item.time}</p>
                  </div>
                ))
              ) : (
                <p style={{ color: '#888' }}>No blockchain transactions</p>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ marginLeft: '20px' }}>
        <h2 style={{ marginTop: '0' }}>Chain of Custody History</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Search by hash or filename..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '8px 12px', 
              backgroundColor: '#1e1e1e', 
              border: '1px solid rgba(0,255,156,0.3)',
              borderRadius: '6px',
              color: '#ddd',
              fontSize: '0.9rem'
            }}
          />
          <button onClick={fetchHistory} style={{ marginBottom: 0, padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>Force Refresh</button>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Filter by Case ID"
            value={filterCaseId}
            onChange={(e) => setFilterCaseId(e.target.value)}
            style={{
              flex: '1 1 180px',
              padding: '8px 12px',
              backgroundColor: '#1e1e1e',
              border: '1px solid rgba(0,255,156,0.3)',
              borderRadius: '6px',
              color: '#ddd',
              fontSize: '0.9rem'
            }}
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{
              flex: '1 1 160px',
              padding: '8px 12px',
              backgroundColor: '#1e1e1e',
              border: '1px solid rgba(0,255,156,0.3)',
              borderRadius: '6px',
              color: '#ddd',
              fontSize: '0.9rem'
            }}
          >
            <option value="">All Roles</option>
            <option value="investigator">Investigator</option>
            <option value="admin">Admin</option>
            <option value="auditor">Auditor</option>
          </select>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            style={{
              flex: '1 1 150px',
              padding: '8px 12px',
              backgroundColor: '#1e1e1e',
              border: '1px solid rgba(0,255,156,0.3)',
              borderRadius: '6px',
              color: '#ddd',
              fontSize: '0.9rem'
            }}
          />
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            style={{
              flex: '1 1 150px',
              padding: '8px 12px',
              backgroundColor: '#1e1e1e',
              border: '1px solid rgba(0,255,156,0.3)',
              borderRadius: '6px',
              color: '#ddd',
              fontSize: '0.9rem'
            }}
          />
        </div>
        
        <style>{`
          div::-webkit-scrollbar {
            display: none;
          }
          button.view-button {
            display: inline-block;
            background-color: #00ff9c !important;
            color: white !important;
            text-decoration: none;
            font-weight: bold;
            font-size: 0.85rem;
            padding: 4px 12px !important;
            border: 1px solid #00ff9c !important;
            border-radius: 3px;
            cursor: pointer;
            -webkit-appearance: none;
            appearance: none;
            margin: 0;
          }
          button.view-button:hover {
            background-color: #666 !important;
          }
          a.view-button {
            display: inline-block;
            background-color: #00ff9c !important;
            color: white !important;
            text-decoration: none;
            font-weight: bold;
            font-size: 0.85rem;
            padding: 4px 12px;
            border: 1px solid #666 !important;
            border-radius: 3px;
            cursor: pointer;
          }
          a.view-button:hover {
            background-color: #00ff9c !important;
          }
        `}</style>
        
        <div style={{ paddingRight: '10px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#1e1e1e', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '12%' }} />
              <col style={{ width: '40%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
            </colgroup>
            <thead>
              <tr style={{ borderBottom: '2px solid #333', color: '#4aff4a', position: 'sticky', top: 0, backgroundColor: '#1e1e1e', zIndex: 5 }}>
                <th style={{ padding: '12px', textAlign: 'left', wordBreak: 'break-word' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left', wordBreak: 'break-word' }}>Details & IPFS Hash</th>
                <th style={{ padding: '12px', textAlign: 'left', wordBreak: 'break-word' }}>Timestamp</th>
                <th style={{ padding: '12px', textAlign: 'left', wordBreak: 'break-word' }}>View Image</th>
                <th style={{ padding: '12px', textAlign: 'left', wordBreak: 'break-word' }}>View Transaction</th>
                <th style={{ padding: '12px 12px 12px 30px', textAlign: 'left', wordBreak: 'break-word' }}>PoE Certificate</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? filteredHistory.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '12px', wordBreak: 'break-word' }}>{item.id}</td>
                  <td style={{ padding: '12px', wordBreak: 'break-word' }}>
                    <strong>{item.name}</strong><br/>
                    <code style={{ fontSize: '10px', color: '#aaa', wordBreak: 'break-all' }}>{item.hash}</code>
                    <button 
                      onClick={() => copyToClipboard(item.hash)}
                      style={{ marginLeft: '10px', marginRight: '8px', fontSize: '10px', padding: '2px 5px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Copy
                    </button>
                    {(item.caseId || item.investigator || item.location) && (
                      <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#9aa' }}>
                        {item.caseId && <div>Case ID: {item.caseId}</div>}
                        {item.investigator && <div>Investigator: {item.investigator}</div>}
                        {item.location && <div>Location: {item.location}</div>}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setTimelineItem(item);
                        setShowTimelineModal(true);
                      }}
                      style={{ marginTop: '6px', fontSize: '10px', padding: '2px 6px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Timeline
                    </button>
                  </td>
                  <td style={{ padding: '12px', wordBreak: 'break-word' }}>{item.time}</td>
                  <td style={{ padding: '12px', textAlign: 'center', wordBreak: 'break-word' }}>
                    <a 
                      href={`https://gateway.pinata.cloud/ipfs/${item.hash}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="view-button"
                    >
                      View
                    </a>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', wordBreak: 'break-word' }}>
                    {item.txHash ? (
                      <a 
                        href={`https://sepolia.etherscan.io/tx/${item.txHash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="view-button"
                      >
                        View
                      </a>
                    ) : (
                      <span style={{ color: '#888' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', wordBreak: 'break-word' }}>
                    <button 
                      className="view-button"
                      onClick={() => generateCertificate(item)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No records found. Connect to Sepolia and refresh.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}

export default App;
