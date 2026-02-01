# Quick Reference: PoE Certificate Feature

## 🚀 Quick Start

### To Generate a Certificate:
1. Look at the "Chain of Custody History" table
2. Find your evidence record
3. Click the orange **"PoE Cert"** button in the rightmost column
4. Certificate modal appears instantly

### To Download:
1. Click **"📥 Download Certificate"** in the modal
2. File saves as `PoE_Certificate_POE-{timestamp}.txt`
3. Share with legal team or archive in case file

---

## 📍 Where to Find It

| Component | Location |
|-----------|----------|
| Button | Chain of Custody History table, rightmost column |
| Modal | Full-screen overlay with certificate details |
| Button Color | Orange (#ff6b35) for legal/official appearance |
| File Format | Plain text (.txt) |

---

## 🎯 What's in the Certificate

| Field | What It Is | Why It Matters |
|-------|-----------|----------------|
| **Certificate Number** | POE-{timestamp} | Unique identifier for this certificate |
| **SHA-256 Hash** | File integrity checksum | Proves exact file content at exact time |
| **IPFS CID** | Distributed storage ID | Proves file exists globally |
| **Investigator Wallet** | Blockchain address | Non-repudiation key (cannot be denied) |
| **Blockchain Timestamp** | When recorded on-chain | Immutable proof of time |
| **Case ID** | Investigation reference | Links to specific case |
| **Investigator Name** | Personnel responsible | Accountability |
| **Location** | Where collected | Context of evidence |
| **Notes** | Observations | Additional details |

---

## 🔒 Non-Repudiation Proof

The certificate proves non-repudiation because:

✅ **Wallet Address** - Only investigator has private key  
✅ **Blockchain Record** - Immutable and timestamped  
✅ **SHA-256 Hash** - Changes if file modified  
✅ **IPFS Verification** - Globally verifiable  
✅ **Legal Declaration** - Formal statement included  

---

## 📝 Code References

### Function: generateCertificate()
- **Location**: Line ~560 in App.jsx
- **What it does**: Creates certificate object and displays modal
- **Parameters**: `item` (evidence record)
- **Logging**: Audit log entry with type `CERTIFICATE_GENERATED`

### Function: downloadCertificate()
- **Location**: Line ~594 in App.jsx
- **What it does**: Exports certificate as formatted text file
- **File Format**: Monospace ASCII art design
- **Filename**: `PoE_Certificate_{CertificateNumber}.txt`

### State Variables
- `showCertificateModal`: Toggles modal visibility
- `certificateData`: Holds certificate object

---

## 🎨 Visual Design

### Button Style
- **Color**: #ff6b35 (Orange - legal/official)
- **Text**: "PoE Cert"
- **Size**: 4px padding, 8px horizontal, 0.8rem font
- **Location**: Table column 6 (rightmost)

### Modal Design
- **Border Color**: #ff6b35 (Orange)
- **Background**: #1e1e1e (Dark)
- **Text Color**: #ddd (Light gray)
- **Header**: Large, professional formatting
- **Content**: Monospace font for hashes and technical data

---

## 📋 Audit Trail

Every certificate generation is recorded:
- **Action Type**: `CERTIFICATE_GENERATED`
- **Logged Data**: Certificate number, evidence hash, on-chain ID
- **Timestamp**: Automatic
- **Actor**: Current wallet address

To view:
1. Go to Admin Dashboard
2. Click "Audit Log" tab
3. Search for "CERTIFICATE_GENERATED"

---

## 💡 Tips & Tricks

### Multiple Certificates
- Can generate multiple certificates for same evidence
- Each gets unique certificate number
- All logged separately in audit trail

### Legal Admissibility
- Include actual certificate file (not screenshot)
- Keep chain of custody documentation
- File with case documents
- Reference audit log for generation history

### Verification by Others
- Share the hash values with legal team
- They can verify on blockchain using:
  - SHA-256: Compare with file
  - IPFS CID: Access file directly
  - Wallet Address: Check blockchain

### Archive Best Practice
- Store .txt file in case folder
- Keep with evidence photos
- Link to in investigation report
- Reference in legal briefs

---

## ⚙️ Technical Details

### Certificate Data Structure
```javascript
{
  certificateNumber,        // Unique ID
  generationTime,          // When created
  title,                   // Display title
  evidenceName,            // Evidence name
  onChainId,              // Blockchain ID
  investigatorWallet,      // Wallet address
  sha256Hash,             // File hash
  ipfsCid,                // Storage ID
  blockchainTimestamp,     // On-chain time
  caseId,                 // Case reference
  investigator,           // Investigator name
  location,               // Collection location
  notes,                  // Observations
  verificationStatus,      // Status flag
  nonRepudiationText,     // Legal statement
  legalDisclaimer,        // Formal warning
  itemDetails             // Full evidence object
}
```

### File Format Features
- ASCII art borders for professional appearance
- Section headers with visual separation
- Monospace font for crypto data
- Legal disclaimers and warnings
- System version information
- Blockchain authentication method noted

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| No button visible | Ensure you're in the evidence history table |
| Modal won't open | Check if evidence record has required data |
| Download fails | Check browser permissions, try different browser |
| Hash missing | Some records may not have SHA-256 stored |
| Certificate blank | Refresh page and try again |

---

## ✨ Key Features at a Glance

| Feature | Status |
|---------|--------|
| Generate certificate | ✅ Implemented |
| Display modal | ✅ Implemented |
| Download as file | ✅ Implemented |
| Non-repudiation proof | ✅ Implemented |
| Audit logging | ✅ Implemented |
| Legal disclaimer | ✅ Included |
| Mobile friendly | ✅ Responsive |
| Error handling | ✅ Included |

---

## 📚 Documentation Files

- **POE_CERTIFICATE_FEATURE.md** - Complete technical documentation
- **IMPLEMENTATION_SUMMARY.md** - Visual overview and features
- **QUICK_REFERENCE.md** - This file

---

## 🎓 Example Workflow

```
1. Upload evidence to blockchain
   ↓
2. Evidence appears in Chain of Custody History table
   ↓
3. Click "PoE Cert" button
   ↓
4. Certificate modal displays instantly
   ↓
5. Review all cryptographic data
   ↓
6. Click "Download Certificate"
   ↓
7. File downloads as PoE_Certificate_POE-{number}.txt
   ↓
8. Submit to legal team
   ↓
9. Entry logged in audit trail
   ↓
10. Certificate remains downloadable anytime
```

---

**Last Updated**: February 1, 2026  
**Version**: 1.0  
**Status**: Production Ready
