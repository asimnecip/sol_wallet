import { 
    Connection, 
    PublicKey, 
    LAMPORTS_PER_SOL, 
    Keypair, 
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
} from '@solana/web3.js';

import * as fs from 'fs';
import * as path from 'path';

const FILE_PATH = path.join(__dirname, 'wallets.json');

const WSS_LOCAL_ENDPOINT = "ws://localhost:8900"
const HTTP_LOCAL_ENDPOINT = 'http://localhost:8899';

const HTTP_DEVNET_ENDPOINT = 'https://api.devnet.solana.com';
const WSS_DEVNET_ENDPOINT = 'wss://api.devnet.solana.com/';

export interface WalletData {
    name:string,
    balance:number,
    // publicKey:PublicKey,
    publicKey:string,
    // secretKey:Uint8Array,
    secretKey:number[],
}

function writeToDB(wallets: Array<WalletData>) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(wallets, null, 2), { encoding: 'utf8' });
}

function updateWallet(walletIndex: number, walletData: WalletData){
    let wallets = getWallets();
    wallets[walletIndex] = walletData;
    writeToDB(wallets)
    console.log(`Updated '${wallets[walletIndex].name}' wallet!`);
}

export function getWallets():Array<WalletData>{
    let wallets = [];
    if (fs.existsSync(FILE_PATH)) {
        const fileContent = fs.readFileSync(FILE_PATH, { encoding: 'utf8' });
        wallets = JSON.parse(fileContent);
    }
    return wallets;
}

export function createWallet(walletName: string) {
    const keypair = Keypair.generate();

    const walletData:WalletData = {
        name:walletName,
        balance: 0,
        publicKey: keypair.publicKey.toBase58(),
        // publicKey: keypair.publicKey,
        secretKey: Array.from(keypair.secretKey),
        // secretKey: keypair.secretKey,
    };

    let wallets = getWallets();

    if (wallets.some(wallet => wallet.name === walletName)) {
        console.log("A wallet with the same name already exists.");
        return;
    }

    wallets.push(walletData);
    writeToDB(wallets);
    console.log(`New wallet created with '${walletName}' name!`);
}


export async function getWalletBalance(
    walletName: string, 
    network:string = "d",
    callback: () => void,
    internal:boolean = false,
    ) {
    let wallets = getWallets();
    let theWallet = wallets.find(wallet => wallet.name === walletName);

    if (!theWallet) {
        console.log(`Wallet named '${walletName}' does not exists!`);
        callback();
        return;
    }

    let httpEndpoint;
    let wssEndpoint;
    if (network == "d") {
        httpEndpoint = HTTP_DEVNET_ENDPOINT;
        wssEndpoint = WSS_DEVNET_ENDPOINT;
    } else if (network == "l") {
        httpEndpoint = HTTP_LOCAL_ENDPOINT;
        wssEndpoint = WSS_LOCAL_ENDPOINT;
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


export async function airdrop (
    walletName:string, 
    amount:string, 
    network:string = 'd',
    callback: () => void,
    ){

    const amountToAirdrop = amount === '' ? LAMPORTS_PER_SOL : parseFloat(amount)*LAMPORTS_PER_SOL;
    const amountToSOL = amountToAirdrop/LAMPORTS_PER_SOL

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

    const sleep = (ms:number) => {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

    let httpEndpoint;
    let wssEndpoint;
    if (network == "d") {
        httpEndpoint = HTTP_DEVNET_ENDPOINT;
        wssEndpoint = WSS_DEVNET_ENDPOINT;
    } else if (network == "l") {
        httpEndpoint = HTTP_LOCAL_ENDPOINT;
        wssEndpoint = WSS_LOCAL_ENDPOINT;
    }


    try {
        const PUBLIC_KEY = new PublicKey(theWallet.publicKey);
        const solanaConnection = new Connection(httpEndpoint!, {wsEndpoint: wssEndpoint});
        
        (async()=>{
            const subscriptionId = await solanaConnection.onAccountChange(
                PUBLIC_KEY,
                (updatedAccountInfo) =>
                    console.log(`---Event Notification for ${PUBLIC_KEY.toString()}--- \nNew Account Balance:`, updatedAccountInfo.lamports / LAMPORTS_PER_SOL, ' SOL'),
                "confirmed"
            );
            await solanaConnection.requestAirdrop(PUBLIC_KEY, amountToAirdrop);
            await solanaConnection.removeAccountChangeListener(subscriptionId);
            
            theWallet["balance"] += amountToSOL;
            updateWallet(theWalletIndex, theWallet);
        })()        
        
    } catch (e) {
        if (e instanceof Error && e.message.includes('429')) {
            console.log("You have requested too many airdrops. Please wait 24 hours before trying again.");
        } else {
            console.log(`Error while airdropping to '${walletName}': ${e}`);
        }
    } finally {
        callback();
    }
}

export async function transfer(
    senderWalletName:string, 
    receiverWalletName:string, 
    amount:string, 
    network:string = 'd',
    callback: () => void,
    ){

    let wallets = getWallets();

    let senderWallet;
    let senderWalletIndex = wallets.findIndex(wallet => wallet.name === senderWalletName);
    if (senderWalletIndex !== -1) senderWallet = wallets[senderWalletIndex];

    let receiverWallet;
    let receiverWalletIndex = wallets.findIndex(wallet => wallet.name === receiverWalletName);
    if (receiverWalletIndex !== -1) receiverWallet = wallets[receiverWalletIndex];

    const amountToSend = amount === '' ? LAMPORTS_PER_SOL : parseFloat(amount)*LAMPORTS_PER_SOL;
    const amountToSOL = amountToSend/LAMPORTS_PER_SOL

    if (!senderWallet) {
        console.log(`Wallet named '${senderWalletName}' does not exists!`);
        callback();
        return;
    } else if (!receiverWallet) {
        console.log(`Wallet named '${receiverWalletName}' does not exists!`);
        callback();
        return;
    }

    let httpEndpoint;
    let wssEndpoint;
    if (network == "d") {
        httpEndpoint = HTTP_DEVNET_ENDPOINT;
        wssEndpoint = WSS_DEVNET_ENDPOINT;
    } else if (network == "l") {
        httpEndpoint = HTTP_LOCAL_ENDPOINT;
        wssEndpoint = WSS_LOCAL_ENDPOINT;
    }

    try {
      const fromPubKey = new PublicKey(senderWallet.publicKey);
      const toPubKey = new PublicKey(receiverWallet.publicKey);
      const solanaConnection = new Connection(httpEndpoint!, {wsEndpoint:wssEndpoint});

      // Doğrudan json'daki wallet'ı kullanmak sorun oluşturdu, keypair'i rebuild etmek tek çözüm!
      const senderSecretKeyUint8Array = new Uint8Array(senderWallet.secretKey);
      const senderKeypair = Keypair.fromSecretKey(senderSecretKeyUint8Array);
    
      (async () => {
        const subscriptionId = await solanaConnection.onAccountChange(
            fromPubKey,
            (updatedAccountInfo) =>
                console.log(`---Event Notification for ${fromPubKey.toString()}--- \nNew Account Balance:`, updatedAccountInfo.lamports / LAMPORTS_PER_SOL, ' SOL'),
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
  
          const signature = await sendAndConfirmTransaction(
              solanaConnection,
              transaction,
              [senderKeypair],
          );
          console.log('SIGNATURE', signature);

        let senderWalletNewBalance = await getWalletBalance(senderWalletName, network, callback, true);
        senderWallet["balance"] = senderWalletNewBalance! / LAMPORTS_PER_SOL;
        updateWallet(senderWalletIndex, senderWallet);

        let receiverWalletNewBalance = await getWalletBalance(receiverWalletName, network, callback, true);
        receiverWallet["balance"] = receiverWalletNewBalance! / LAMPORTS_PER_SOL;
        updateWallet(receiverWalletIndex, receiverWallet);
        
        await solanaConnection.removeAccountChangeListener(subscriptionId);

    })()
    
    } catch (e) {
        if (e instanceof Error && e.message.includes('429')) {
            console.log("You have requested too many transfer. Please wait 24 hours before trying again.");
        } else {
            console.log(`Error while transfer: ${e}`);
        }
    } finally {
        callback();
    }

}



