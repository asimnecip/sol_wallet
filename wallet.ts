import { Connection, PublicKey, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

const FILE_PATH = path.join(__dirname, 'wallet.json');

const WSS_ENDPOINT = 'wss://api.devnet.solana.com/';
const HTTP_ENDPOINT = 'https://api.devnet.solana.com';

export interface WalletData {
    name:string,
    balance:number,
    publicKey:string,
    privateKey:Array<number>,
}

function writeToDB(wallets: Array<WalletData>) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(wallets, null, 2), { encoding: 'utf8' });
}

export function getWallets():Array<WalletData>{
    let wallets = [];
    if (fs.existsSync(FILE_PATH)) {
        const fileContent = fs.readFileSync(FILE_PATH, { encoding: 'utf8' });
        wallets = JSON.parse(fileContent);
    }
    return wallets;
}

export function createWallet(name: string) {
    const keypair = Keypair.generate();
    const solanaConnection = new Connection(HTTP_ENDPOINT,{wsEndpoint:WSS_ENDPOINT});

    const walletData:WalletData = {
        name:name,
        balance: 0,
        publicKey: keypair.publicKey.toBase58(),
        privateKey: Array.from(keypair.secretKey),
    };

    let wallets = getWallets();
    wallets.push(walletData);
    writeToDB(wallets);
    console.log(`New wallet created with '${name}' name!`);
}


export function getWalletBalance(walletName: string) {
    let wallets = getWallets();
    let theWallet = wallets.find(wallet => wallet.name === walletName);

    let PUBLIC_KEY;
    try{
        PUBLIC_KEY = new PublicKey(theWallet!.publicKey);
    }
    catch (e) {
        console.log(`Wallet named '${walletName}' does not exists!`);
        return;
    }
    const solanaConnection = new Connection(HTTP_ENDPOINT,{wsEndpoint:WSS_ENDPOINT});

    (async()=>{
        let balance = await solanaConnection.getBalance(PUBLIC_KEY);
        console.log(`SOLANA_WALLET balance is ${balance / LAMPORTS_PER_SOL} Sol`);
        return;
    })()
}

function updateWallet(walletIndex: number, walletData: WalletData){
    let wallets = getWallets();
    wallets[walletIndex] = walletData;
    writeToDB(wallets)
    console.log(`Updated '${wallets[walletIndex].name}' wallet!`);
}

export function airdrop (walletName:string, amount:string){
    const amountToAirdrop = amount === '' ? LAMPORTS_PER_SOL : Number(amount);

    let wallets = getWallets();
    console.log(amount);
    let theWallet = wallets.find(wallet => wallet.name === walletName);

    let PUBLIC_KEY:PublicKey;
    try {
      PUBLIC_KEY = new PublicKey(theWallet!.publicKey);
    } catch (e) {
      console.log(`Wallet named '${walletName}' does not exists!`);
      return;
    }

    const solanaConnection = new Connection(HTTP_ENDPOINT,{wsEndpoint:WSS_ENDPOINT});
    const sleep = (ms:number) => {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    (async()=>{
        const subscriptionId = await solanaConnection.onAccountChange(
            PUBLIC_KEY,
            (updatedAccountInfo) =>
                console.log(`---Event Notification for ${PUBLIC_KEY.toString()}--- \nNew Account Balance:`, updatedAccountInfo.lamports / LAMPORTS_PER_SOL, ' SOL'),
            "confirmed"
        );
        console.log('Starting web socket, subscription ID: ', subscriptionId);
        await sleep(10000); //Wait 10 seconds for Socket Testing
        await solanaConnection.requestAirdrop(PUBLIC_KEY, amountToAirdrop);
        await sleep(10000); //Wait 10 for Socket Testing
        await solanaConnection.removeAccountChangeListener(subscriptionId);
        console.log(`Websocket ID: ${subscriptionId} closed.`);

    })()
}


