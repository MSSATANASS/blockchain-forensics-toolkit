const fs = require('fs');
const path = require('path');
const xrpl = require('xrpl'); // Using the 'core' library
const bip39 = require('bip39');

// TARGETS
const TARGET_REGULAR = "r..."; 
const TARGET_MASTER = "r...";

// REGEX PATTERNS
const PATTERNS = {
    rippleSecret: /s[1-9A-HJ-NP-Za-km-z]{28}/g,
    hex32: /\b[0-9a-fA-F]{32}\b/g, // 16 bytes hex (entropy)
    hex64: /\b[0-9a-fA-F]{64}\b/g, // 32 bytes hex (private key)
};

const IGNORE_EXTENSIONS = ['.git', '.png', '.jpg', '.pdf', '.exe', '.dll', '.node'];
const IGNORE_FILES = ['scavenger_hunt.js', 'package-lock.json', 'global_js.21de6e5730b10ce00fa6.bundle.js'];

// Load wordlist for mnemonic detection
const WORDLIST = bip39.wordlists.english;
const wordSet = new Set(WORDLIST);

function isLikelyMnemonic(text) {
    // Basic heuristic: sequence of 12+ valid BIP39 words
    // normalize spaces
    const words = text.replace(/[\r\n\t]/g, ' ').split(' ').filter(w => w.length > 0);
    if (words.length < 12) return false;
    
    // Check overlapping windows
    for (let i = 0; i <= words.length - 12; i++) {
        let validCount = 0;
        let phrase = [];
        for (let j = 0; j < 12; j++) {
            const w = words[i + j].toLowerCase().replace(/[^a-z]/g, '');
            if (wordSet.has(w)) {
                validCount++;
                phrase.push(w);
            }
        }
        if (validCount === 12) {
            return phrase.join(' ');
        }
    }
    return null;
}

async function testCandidate(type, candidate) {
    try {
        let wallet;
        if (type === 'rippleSecret') {
            wallet = xrpl.Wallet.fromSeed(candidate);
        } else if (type === 'hex64') {
            // Assume private key
            wallet = new xrpl.Wallet(candidate); // might need formatted key
            // Try as seed entropy first? xrpl.js handles seeds mostly.
            // fallback to fromEntropy if it looks like entropy
             try { wallet = xrpl.Wallet.fromEntropy(candidate); } catch(e) {};
        } else if (type === 'hex32') {
             try { wallet = xrpl.Wallet.fromEntropy(candidate); } catch(e) {};
        } else if (type === 'mnemonic') {
            wallet = xrpl.Wallet.fromMnemonic(candidate);
        }

        if (wallet) {
            if (wallet.address === TARGET_REGULAR) {
                console.log(`\n!!! FOUND REGULAR KEY !!!`);
                console.log(`Type: ${type}`);
                console.log(`Value: ${candidate}`);
                console.log(`Address: ${wallet.address}`);
                fs.writeFileSync("FOUND_REGULAR_KEY.txt", `${type}: ${candidate}`);
                return true;
            }
            if (wallet.address === TARGET_MASTER) {
                // Just log, don't stop (we know the master mnemonic)
                if (!candidate.startsWith('abandon')) {
                     console.log(`Found ALTERNATIVE credential for Master: [${type}] ${candidate.substring(0, 10)}...`);
                }
            }
        }
    } catch (e) {
        // console.log(`Invalid candidate ${candidate}: ${e.message}`);
    }
    return false;
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (file !== '.git' && file !== 'node_modules') traverseDir(fullPath);
        } else {
            if (IGNORE_FILES.includes(file)) continue;
            if (stat.size > 50 * 1024 * 1024) continue; // Skip > 50MB
            
            scanFile(fullPath);
        }
    }
}

function scanFile(filePath) {
    // console.log(`Scanning ${filePath}...`);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 1. Regex Scans
        for (const [type, regex] of Object.entries(PATTERNS)) {
            const matches = content.match(regex);
            if (matches) {
                for (const m of matches) {
                    testCandidate(type, m);
                }
            }
        }
        
        // 2. Mnemonic Scan
        // This is expensive, so we just scan the whole file content as one heuristic
        // Or split by newlines for better accuracy?
        // Let's split by lines to avoid memory issues on big lines
        const lines = content.split('\n');
        for (const line of lines) {
            if (line.length > 30) {
                const mnemonic = isLikelyMnemonic(line);
                if (mnemonic) {
                    testCandidate('mnemonic', mnemonic);
                }
            }
        }

    } catch (e) {
        console.log(`Error reading ${filePath}: ${e.message}`);
    }
}

console.log("Starting Scavenger Hunt...");
traverseDir(__dirname);
console.log("Hunt Complete.");
