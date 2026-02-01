# Proof of Existence (PoE) Certificate Feature

## Overview
A formal **Proof of Existence (PoE) Verification Certificate** feature has been added to the Evidence Management System. This feature allows investigators to generate official certificates for individual pieces of evidence, demonstrating cryptographic proof of existence, ownership, and integrity suitable for legal proceedings.

## Key Features

### 1. **Certificate Generation**
- **Function**: `generateCertificate(item)`
- **Location**: Triggered by clicking the "PoE Cert" button on any evidence record in the Chain of Custody History table
- **What it includes**:
  - **Unique Certificate Number**: POE-{timestamp} format
  - **Generation Timestamp**: When the certificate was created
  - **On-Chain ID**: The blockchain-recorded evidence ID
  - **Investigator Wallet Address**: The wallet address that holds the evidence (cryptographic identifier)
  - **SHA-256 Hash**: Cryptographic hash ensuring file integrity
  - **IPFS CID**: The distributed storage identifier for immutable access
  - **Blockchain Timestamp**: When the evidence was recorded on-chain
  - **Case ID**: Associated case information
  - **Investigator Name**: Personnel information
  - **Location**: Where evidence was collected
  - **Notes**: Additional observations and details
  - **Verification Status**: Marked as VERIFIED
  - **Non-Repudiation Declaration**: Legal statement about cryptographic proof
  - **Legal Disclaimer**: Formal warning for legal use

### 2. **Certificate Display Model**
A professional, formal modal displays the certificate with:
- High-contrast layout with orange (#ff6b35) accent color for official appearance
- Monospace font for cryptographic data
- Structured sections for easy reading
- All critical information prominently displayed
- Scrollable content area for lengthy certificates

### 3. **Certificate Download**
- **Function**: `downloadCertificate()`
- Downloads certificate as a formatted `.txt` file
- Filename format: `PoE_Certificate_{CertificateNumber}.txt`
- Includes ASCII art borders for formal presentation
- Professional formatting suitable for legal documentation
- Preserves all certificate data in plain text format

## Non-Repudiation Aspects

The certificate demonstrates **non-repudiation** through:

1. **Wallet Signature**: The investigator's blockchain wallet address serves as a cryptographic identifier that cannot be repudiated
2. **Immutable Blockchain Record**: All timestamps and hashes are permanently recorded on the blockchain, making them tamper-evident
3. **SHA-256 Hash**: Cryptographic proof that the exact file content was present at a specific time
4. **IPFS CID**: Distributed storage verification that the file exists and is accessible
5. **Blockchain Timestamp**: Provides verifiable proof that evidence was recorded at a specific time, impossible to forge retroactively

## How to Use

### Generating a Certificate:

1. Navigate to the **"Chain of Custody History"** section
2. Locate the evidence record you want to certify
3. Click the **"PoE Cert"** button (orange, in the rightmost column)
4. A formal certificate modal will appear with all evidence details
5. Review the certificate information

### Downloading a Certificate:

1. In the certificate modal, click **"📥 Download Certificate"**
2. The file will download as `PoE_Certificate_POE-{timestamp}.txt`
3. Share with legal teams or archive in case files

### Closing the Certificate:

1. Click **"Close"** to dismiss the modal without downloading
2. The certificate data remains in memory for re-opening if needed

## Technical Implementation

### State Variables Added:
```javascript
const [showCertificateModal, setShowCertificateModal] = useState(false);
const [certificateData, setCertificateData] = useState(null);
```

### Functions Implemented:
- **`generateCertificate(item)`**: Creates certificate data object and displays modal
- **`downloadCertificate()`**: Exports certificate as formatted text file

### Audit Logging:
- Each certificate generation is logged in the audit trail
- Logs include: certificate number, evidence hash, and on-chain ID
- Action type: `CERTIFICATE_GENERATED`

### UI Changes:
- Added "Certificate" column to the Chain of Custody History table
- New "PoE Cert" button for each evidence record
- Professional certificate modal with scrollable content
- Download button with icon for clear action

## Certificate Data Structure

```javascript
{
  certificateNumber,        // Unique identifier
  generationTime,          // When generated
  title,                   // "PROOF OF EXISTENCE (PoE) VERIFICATION CERTIFICATE"
  evidenceName,            // Name of the evidence
  onChainId,              // Blockchain recorded ID
  investigatorWallet,      // Wallet address (non-repudiation key)
  sha256Hash,             // File integrity hash
  ipfsCid,                // Distributed storage identifier
  blockchainTimestamp,     // Time recorded on-chain
  caseId,                 // Associated case
  investigator,           // Investigator name
  location,               // Collection location
  notes,                  // Observations
  verificationStatus,      // "VERIFIED"
  nonRepudiationText,     // Legal non-repudiation statement
  legalDisclaimer,        // Formal legal warning
  itemDetails             // Full evidence object reference
}
```

## Security & Legal Considerations

1. **Non-Repudiation**: The wallet address and blockchain timestamp create a cryptographic proof that cannot be denied
2. **Immutability**: Once on-chain, the evidence record cannot be altered
3. **Tamper-Evidence**: SHA-256 hash immediately reveals any file modification
4. **Distributed Proof**: IPFS CID proves the file exists across distributed nodes
5. **Legal Compliance**: The certificate includes appropriate disclaimers and qualifications for legal use

## Certificate Format Features

The downloaded certificate includes:
- Professional ASCII art border
- Clear section headers with colored formatting
- Cryptographic hashes displayed in full
- Investigator wallet address for accountability
- Blockchain consensus information
- Non-repudiation legal statement
- System version information
- Permanent validity marker

## Use Cases

1. **Legal Proceedings**: Submit as proof of evidence integrity and non-repudiation
2. **Chain of Custody Documentation**: Official record for investigation files
3. **Investigator Accountability**: Wallet address provides non-deniable proof of involvement
4. **Evidence Verification**: SHA-256 and IPFS CID allow external verification
5. **Audit Compliance**: Complete record for forensic and compliance audits

## Example Certificate Content

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                                                                                ║
║             PROOF OF EXISTENCE (PoE) VERIFICATION CERTIFICATE                  ║
║                                                                                ║
╚════════════════════════════════════════════════════════════════════════════════╝

CERTIFICATE NUMBER:        POE-1234567890
GENERATED:                 2/1/2026, 10:30:45 AM
VERIFICATION STATUS:       VERIFIED

─────────────────────────────────────────────────────────────────────────────────

EVIDENCE DETAILS:

  Evidence Name:           crime_scene_photo.jpg
  On-Chain ID:             1
  Case ID:                 CASE-2026-001
  Investigator Name:       John Smith
  Investigation Location:  Lat 40.7128, Lng -74.0060

─────────────────────────────────────────────────────────────────────────────────

CRYPTOGRAPHIC VERIFICATION:

  SHA-256 Hash:            a1b2c3d4e5f6... (full hash)
  IPFS CID:                QmXxxx... (full CID)
  Investigator Wallet:     0x1234567890abcdef...
  Blockchain Timestamp:    2/1/2026, 10:15:00 AM

─────────────────────────────────────────────────────────────────────────────────

NON-REPUDIATION DECLARATION:

This certificate serves as cryptographic proof of existence, ownership, and 
integrity of the evidence. The investigator wallet address and digital signatures 
create an immutable, non-repudiable record suitable for legal proceedings.
```

## Notes

- Certificates are generated on-demand and not stored on-chain
- Each certificate gets a unique number based on generation timestamp
- The investigator's current wallet is used as the authority
- All certificates are added to the audit log for compliance tracking
- Certificates can be regenerated at any time from the same evidence record

---

**Implementation Date**: February 1, 2026  
**Feature Type**: Legal/Forensic Compliance  
**Status**: Fully Implemented and Tested
