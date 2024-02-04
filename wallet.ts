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
import { get } from 'http';
import * as path from 'path';

const FILE_PATH = path.join(__dirname, 'wallets.json');

const WSS_ENDPOINT = 'wss://api.testnet.solana.com/';
const HTTP_ENDPOINT = 'https://api.testnet.solana.com';

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
    // Check if a wallet with the same name already exists
    if (wallets.some(wallet => wallet.name === walletName)) {
        console.log("A wallet with the same name already exists.");
        return;
    }

    wallets.push(walletData);
    writeToDB(wallets);
    console.log(`New wallet created with '${walletName}' name!`);
}


export async function getWalletBalance(walletName: string, callback: () => void) {
    let wallets = getWallets();
    let theWallet = wallets.find(wallet => wallet.name === walletName);

    if (!theWallet) {
        console.log(`Wallet named '${walletName}' does not exists!`);
        callback();
        return;
    }

    try {
        const PUBLIC_KEY = new PublicKey(theWallet.publicKey);
        const solanaConnection = new Connection(HTTP_ENDPOINT, {wsEndpoint: WSS_ENDPOINT});
        let balance = await solanaConnection.getBalance(PUBLIC_KEY);
        console.log(`Balance of ${walletName} wallet is ${balance / LAMPORTS_PER_SOL} Sol`);
    } catch (e) {
        console.log(`Error getting balance for '${walletName}': ${e}`);
    } finally {
        callback();
    }
}


export async function airdrop (walletName:string, amount:string, callback: () => void){
    const amountToAirdrop = amount === '' ? LAMPORTS_PER_SOL : parseFloat(amount)*LAMPORTS_PER_SOL;

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
  
    try {
        const PUBLIC_KEY = new PublicKey(theWallet.publicKey);
        const solanaConnection = new Connection(HTTP_ENDPOINT, {wsEndpoint: WSS_ENDPOINT});
        
        (async()=>{
            const subscriptionId = await solanaConnection.onAccountChange(
                PUBLIC_KEY,
                (updatedAccountInfo) =>
                    console.log(`---Event Notification for ${PUBLIC_KEY.toString()}--- \nNew Account Balance:`, updatedAccountInfo.lamports / LAMPORTS_PER_SOL, ' SOL'),
                "confirmed"
            );
            console.log('Starting web socket, subscription ID: ', subscriptionId);
            await sleep(5000);
            console.log(amountToAirdrop);
            await solanaConnection.requestAirdrop(PUBLIC_KEY, amountToAirdrop);
            await sleep(5000); 
            await solanaConnection.removeAccountChangeListener(subscriptionId);
            
            console.log("parseFloat(amount)");
            console.log(parseFloat(amount).toString());
            theWallet["balance"] += parseFloat(amount);
            updateWallet(theWalletIndex, theWallet);
            console.log(`Websocket ID: ${subscriptionId} closed.`);
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
    callback: () => void){

    let wallets = getWallets();
    let senderWallet = wallets.find(wallet => wallet.name === senderWalletName);
    let receiverWallet = wallets.find(wallet => wallet.name === receiverWalletName);
    const amountToSend = amount === '' ? LAMPORTS_PER_SOL : Number(amount);

    if (!senderWallet) {
        console.log(`Wallet named '${senderWalletName}' does not exists!`);
        callback();
        return;
    } else if (!receiverWallet) {
        console.log(`Wallet named '${receiverWalletName}' does not exists!`);
        callback();
        return;
    }
    
    try {
      const fromPubKey = new PublicKey(senderWallet.publicKey);
      const toPubKey = new PublicKey(receiverWallet.publicKey);
      const solanaConnection = new Connection(HTTP_ENDPOINT,{wsEndpoint:WSS_ENDPOINT});

      // Doğrudan json'daki wallet'ı kullanmak sorun oluşturdu, keypair'i rebuild etmek tek çözüm!
      const senderSecretKeyUint8Array = new Uint8Array(senderWallet.secretKey);
      const senderKeypair = Keypair.fromSecretKey(senderSecretKeyUint8Array);
    
      (async () => {
          let transaction = new Transaction();
          
          transaction.add(
              SystemProgram.transfer({
              fromPubkey: fromPubKey,
              toPubkey: toPubKey,
              lamports: amountToSend/100,
              }),
          );
  
          const signature = await sendAndConfirmTransaction(
              solanaConnection,
              transaction,
              [senderKeypair],
          );
          console.log('SIGNATURE', signature);
      })()
    
    } catch (e) {
        if (e instanceof Error && e.message.includes('429')) {
            console.log("You have requested too many airdrops. Please wait 24 hours before trying again.");
        } else {
            console.log(`Error while transfer: ${e}`);
        }
    } finally {
        callback();
    }

}



