const xrpl = require("xrpl");
const fs = require("fs");

const CANDIDATES = [
    // Add your seeds or hex keys here for verification
    // { type: 'seed', value: "sEd..." },
    // { type: 'hex',  value: "0000..." } 
];

const TARGET_REGULAR = "r..."; // Target Regular Key Address
const TARGET_MASTER = "r...";  // Target Master Address

async function verifySeeds() {
    console.log("Verifying Candidates...");
    console.log(`Target: ${TARGET_REGULAR}`);

    for (const item of CANDIDATES) {
        let wallet = null;
        try {
            if (item.type === 'seed') {
                wallet = xrpl.Wallet.fromSeed(item.value);
            } else if (item.type === 'hex') {
                // Try as Entropy (Seed)
                try {
                    wallet = xrpl.Wallet.fromEntropy(item.value);
                    console.log(`\n[Hex -> Entropy] ${item.value.substring(0,10)}...`);
                    checkWallet(wallet);
                } catch(e) { console.log(`Not entropy: ${e.message}`); }

                // Try as Private Key directly
                try {
                    // XRPL.js needs '00' prefix usually if its secp256k1?? No, just hex string usually works for Wallet constructor key
                    // Actually new Wallet(publicKey, privateKey)
                    // We don't have public key.
                    // But we can try ECDSA derivation?
                    // Let's stick to fromEntropy which is most likely for a 64-char hex
                } catch(e) {}
            }

            if (item.type === 'seed') {
               console.log(`\n[Seed] ${item.value}`);
               checkWallet(wallet);
            }

        } catch (e) {
            console.log(`Error processing ${item.value}: ${e.message}`);
        }
    }
}

function checkWallet(wallet) {
    if (!wallet) return;
    console.log(`Address: ${wallet.address}`);
    console.log(`Public:  ${wallet.publicKey}`);
    
    if (wallet.address === TARGET_REGULAR) {
        console.log("!!! MATCH FOUND - REGULAR KEY !!!");
        console.log("SAVING TO FOUND_KEY.txt");
        fs.writeFileSync("FOUND_KEY.txt", `HEX: ${wallet.seed || 'entropy'}\nKey: ${wallet.privateKey}`);
    } else if (wallet.address === TARGET_MASTER) {
        console.log("!!! MATCH FOUND - MASTER KEY !!!");
    } else {
        console.log("No match.");
    }
}

verifySeeds();

