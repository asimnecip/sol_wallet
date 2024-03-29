// Import classes and functions from the Solana Web3.js library to interact with the Solana blockchain.
import { 
    Connection, // Used to establish a connection with the Solana blockchain.
    PublicKey, // Represents a public key in the Solana blockchain, used for addressing accounts.
    LAMPORTS_PER_SOL, // Constant representing the number of lamports in one SOL (Solana's cryptocurrency).
    Keypair, // Represents a keypair in the Solana blockchain, consisting of a public and private key.
    Transaction, // Used to construct and work with transactions on the Solana blockchain.
    SystemProgram, // Provides utilities for common operations like transferring SOL.
    sendAndConfirmTransaction, // Function to send a transaction and await its confirmation.
} from '@solana/web3.js';

// Node.js modules for file system operations and handling file paths.
import * as fs from 'fs';
import * as path from 'path';

// Constants for the file path of the wallets database and network endpoints for connecting to Solana nodes.
const FILE_PATH = path.join(__dirname, 'wallets.json');

// Source to get these addresses: https://academy.patika.dev/courses/solana-development-i/setting-up-locally
const WSS_LOCAL_ENDPOINT = "ws://localhost:8900"
const HTTP_LOCAL_ENDPOINT = 'http://localhost:8899';
const HTTP_DEVNET_ENDPOINT = 'https://api.devnet.solana.com';
const WSS_DEVNET_ENDPOINT = 'wss://api.devnet.solana.com/';

// Interface defining the structure of a wallet object stored in our local database.
export interface WalletData {
    name:string,
    balance:number,
    // publicKey:PublicKey, // Not used due to formatting issues
    publicKey:string,
    // secretKey:Uint8Array, // Not used due to formatting issues
    secretKey:number[],
}

// Function to write the array of wallets to the local JSON file, effectively saving the "database" aka "wallets.json" .
function writeToDB(wallets: Array<WalletData>) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(wallets, null, 2), { encoding: 'utf8' });
}

// Updates a specific wallet in the array and saves the updated array to the local JSON file.
function updateWallet(walletIndex: number, walletData: WalletData){
    let wallets = getWallets();
    wallets[walletIndex] = walletData;
    writeToDB(wallets)
    console.log(`Updated '${wallets[walletIndex].name}' wallet!`);
}

// Reads the wallets from the local JSON file and returns them as an array of WalletData.
export function getWallets():Array<WalletData>{
    let wallets = [];
    if (fs.existsSync(FILE_PATH)) {
        const fileContent = fs.readFileSync(FILE_PATH, { encoding: 'utf8' });
        wallets = JSON.parse(fileContent);
    }
    return wallets;
}

// Generates a new Solana keypair, checks for name uniqueness, and saves the new wallet to the local database.
export function createWallet(walletName: string) {
    const keypair = Keypair.generate(); // new wallet is actually a keypair?

    const walletData:WalletData = {
        name:walletName,
        balance: 0,
        publicKey: keypair.publicKey.toBase58(),
        // publicKey: keypair.publicKey, // Not used due to formatting issues
        secretKey: Array.from(keypair.secretKey),
        // secretKey: keypair.secretKey, // Not used due to formatting issues
    };

    // getting all wallets to push a new one into them 
    let wallets = getWallets();
    if (wallets.some(wallet => wallet.name === walletName)) {
        console.log("A wallet with the same name already exists.");
        return;
    }

    // inserting new wallet into the wallets.json 
    wallets.push(walletData);
    writeToDB(wallets);
    console.log(`New wallet created with '${walletName}' name!`);
}

// Fetches the balance of a specified wallet from the Solana blockchain using the provided network endpoint.
export async function getWalletBalance(
    walletName: string, 
    network:string = "d",
    callback: () => void,
    internal:boolean = false,
    ) {

    // getting the wallet to be processed from db 
    let wallets = getWallets();
    let theWallet = wallets.find(wallet => wallet.name === walletName);

    if (!theWallet) {
        console.log(`Wallet named '${walletName}' does not exists!`);
        callback();
        return;
    }

    // choosing endpoint to connect desired network, not a fancy thing :)
    let httpEndpoint, wssEndpoint;
    switch(network) {
        case "d":
            httpEndpoint = HTTP_DEVNET_ENDPOINT;
            wssEndpoint = WSS_DEVNET_ENDPOINT;
            break;
        case "l":
            httpEndpoint = HTTP_LOCAL_ENDPOINT;
            wssEndpoint = WSS_LOCAL_ENDPOINT;
            break;
    }

    try {
        const PUBLIC_KEY = new PublicKey(theWallet.publicKey);
        const solanaConnection = new Connection(httpEndpoint!, {wsEndpoint: wssEndpoint!});
        let balance = await solanaConnection.getBalance(PUBLIC_KEY);
        
        if (!internal) {
            console.log(`Balance of ${walletName} wallet is ${balance / LAMPORTS_PER_SOL} Sol`);
        }
        return balance;
    } catch (e) {
        console.log(`Error getting balance for '${walletName}': ${e}`);
    } finally {
        if (!internal) {
            callback();
        }
    }
}

// Requests an airdrop of SOL to a specified wallet and listens for account changes to confirm the airdrop completion.
export async function airdrop (
    walletName:string, 
    amount:string, 
    network:string = 'd',
    callback: () => void,
    ){

    const amountToAirdrop = amount === '' ? LAMPORTS_PER_SOL : parseFloat(amount)*LAMPORTS_PER_SOL;
    const amountToSOL = amountToAirdrop/LAMPORTS_PER_SOL
    
    // getting the wallet to be processed from db 
    let wallets = getWallets();
    let theWallet;
    let theWalletIndex = wallets.findIndex(wallet => wallet.name === walletName);
    
    if (theWalletIndex !== -1) {
        theWallet = wallets[theWalletIndex];
    }

    if (!theWallet) {
        console.log(`Wallet named '${walletName}' does not exists!`);
        callback();
        return;
    }

    // choosing endpoint to connect desired network, not a fancy thing :)
    let httpEndpoint, wssEndpoint;
    switch(network) {
        case "d":
            httpEndpoint = HTTP_DEVNET_ENDPOINT;
            wssEndpoint = WSS_DEVNET_ENDPOINT;
            break;
        case "l":
            httpEndpoint = HTTP_LOCAL_ENDPOINT;
            wssEndpoint = WSS_LOCAL_ENDPOINT;
            break;
    }

    const PUBLIC_KEY = new PublicKey(theWallet.publicKey);
    const solanaConnection = new Connection(httpEndpoint!, {wsEndpoint: wssEndpoint});
    
    (async()=>{
        try {
            const subscriptionId = solanaConnection.onAccountChange(
                PUBLIC_KEY,
                (updatedAccountInfo) =>
                // console.log(`---Event Notification for ${PUBLIC_KEY.toString()}--- \nNew Account Balance:`, updatedAccountInfo.lamports / LAMPORTS_PER_SOL, ' SOL'),
                console.log("Please wait for the process to finish..."),
                "confirmed"
            );
            
            const signature = await solanaConnection.requestAirdrop(PUBLIC_KEY, amountToAirdrop);
            // getting latestBlockHash to confirm the signature
            // by doing this we can "really" await the airdrop 
            const latestBlockHash = await solanaConnection.getLatestBlockhash();

            await solanaConnection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: signature,
              });
              
            theWallet["balance"] += amountToSOL;
            updateWallet(theWalletIndex, theWallet);

            await solanaConnection.removeAccountChangeListener(subscriptionId);
        } catch (e) {
            if (e instanceof Error && e.message.includes('429')) {
                console.log("You have requested too many airdrops. Please wait 24 hours before trying again.");
            } else {
                console.log(`Error while airdropping to '${walletName}': ${e}`);
            }
        } finally {
            console.log("Airdrop has been completed. You can check your account!");
            callback();
        }
    })() 
}

export async function transfer(
    senderWalletName:string, 
    receiverWalletName:string, 
    amount:string, 
    network:string = 'd',
    callback: () => void,
    ){

    // getting the wallets to be processed from db 
    let wallets = getWallets();

    let senderWallet;
    let senderWalletIndex = wallets.findIndex(wallet => wallet.name === senderWalletName);
    if (senderWalletIndex !== -1) senderWallet = wallets[senderWalletIndex];

    let receiverWallet;
    let receiverWalletIndex = wallets.findIndex(wallet => wallet.name === receiverWalletName);
    if (receiverWalletIndex !== -1) receiverWallet = wallets[receiverWalletIndex];

    const amountToSend = amount === '' ? LAMPORTS_PER_SOL : parseFloat(amount)*LAMPORTS_PER_SOL;

    if (!senderWallet) {
        console.log(`Wallet named '${senderWalletName}' does not exists!`);
        callback();
        return;
    } else if (!receiverWallet) {
        console.log(`Wallet named '${receiverWalletName}' does not exists!`);
        callback();
        return;
    }

    // choosing endpoint to connect desired network, not a fancy thing :)
    let httpEndpoint, wssEndpoint;
    switch(network) {
        case "d":
            httpEndpoint = HTTP_DEVNET_ENDPOINT;
            wssEndpoint = WSS_DEVNET_ENDPOINT;
            break;
        case "l":
            httpEndpoint = HTTP_LOCAL_ENDPOINT;
            wssEndpoint = WSS_LOCAL_ENDPOINT;
            break;
    }

    // getting public keys to make the transfer
    const fromPubKey = new PublicKey(senderWallet.publicKey);
    const toPubKey = new PublicKey(receiverWallet.publicKey);
    const solanaConnection = new Connection(httpEndpoint!, {wsEndpoint:wssEndpoint});

    // Doğrudan json'daki wallet'ı kullanmak sorun oluşturdu, keypair'i bu şekilde rebuild etmek tek çözüm!
    const senderSecretKeyUint8Array = new Uint8Array(senderWallet.secretKey);
    const senderKeypair = Keypair.fromSecretKey(senderSecretKeyUint8Array);

    (async () => {
        try{
            const subscriptionId = solanaConnection.onAccountChange(
                fromPubKey,
                (updatedAccountInfo) =>
                    console.log("Please wait for the process to finish..."),
                "confirmed"
                );
    
            let transaction = new Transaction();
            
            transaction.add(
                SystemProgram.transfer({
                fromPubkey: fromPubKey,
                toPubkey: toPubKey,
                lamports: amountToSend,
                }),
            );

            // sendAndConfirmTransaction used for the transfer unlike airdrop process
            const signature = await sendAndConfirmTransaction(
                solanaConnection,
                transaction,
                [senderKeypair],
            );
            // console.log('SIGNATURE', signature);
    
            let senderWalletNewBalance = await getWalletBalance(senderWalletName, network, callback, true);
            senderWallet["balance"] = senderWalletNewBalance! / LAMPORTS_PER_SOL;
            updateWallet(senderWalletIndex, senderWallet);
    
            let receiverWalletNewBalance = await getWalletBalance(receiverWalletName, network, callback, true);
            receiverWallet["balance"] = receiverWalletNewBalance! / LAMPORTS_PER_SOL;
            updateWallet(receiverWalletIndex, receiverWallet);
            
            // removing subscription id from listeners, like releasing the lock of a thread
            await solanaConnection.removeAccountChangeListener(subscriptionId);
        } catch (e) {
            if (e instanceof Error && e.message.includes('429')) {
                console.log("You have requested too many transfer. Please wait 24 hours before trying again.");
            } else {
                console.log(`Error while transfer: ${e}`);
            }
        } finally {
            console.log("Transfer has been completed. You can check your accounts!");
            callback();
        }
    })()
}
