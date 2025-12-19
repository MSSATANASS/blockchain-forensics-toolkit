# Blockchain Forensics Toolkit

A collection of Node.js and Python scripts for blockchain analysis, key recovery, and security auditing.

## Tools Included

### 1. `scavenger_hunt.js` - File System Entropy Scanner

Scans directories for potential private keys, mnemonics, and cryptographic patterns using RegExp heuristics.

- **Features**: Detects BIP39 mnemonics, Ripple secrets (s...), and raw hex keys.
- **Usage**: `node scavenger_hunt.js`

### 2. `verify_seeds.js` - XRPL Key Verifier

Verifies multiple key formats (Ed25519 seeds, secp256k1, raw entropy) against target addresses on the XRP Ledger.

- **Usage**: Edit the `CANDIDATES` array and run `node verify_seeds.js`.

### 3. `check_xprv_final.py` - Advanced BIP32 Derivation

Python script to derive addresses from Extended Private Keys (xprv) across multiple paths and indices. Useful for recovering HD wallet hierarchies.

## Disclaimer

These tools are for educational and forensic recovery purposes only. Always handle private keys in an offline, secure environment.
