"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transfer = exports.airdrop = exports.getWalletBalance = exports.createWallet = exports.getWallets = void 0;
const web3_js_1 = require("@solana/web3.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const FILE_PATH = path.join(__dirname, 'wallets.json');
const WSS_ENDPOINT = 'wss://api.devnet.solana.com/';
const HTTP_ENDPOINT = 'https://api.devnet.solana.com';
function writeToDB(wallets) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(wallets, null, 2), { encoding: 'utf8' });
}
function getWallets() {
    let wallets = [];
    if (fs.existsSync(FILE_PATH)) {
        const fileContent = fs.readFileSync(FILE_PATH, { encoding: 'utf8' });
        wallets = JSON.parse(fileContent);
    }
    return wallets;
}
exports.getWallets = getWallets;
function createWallet(name) {
    const keypair = web3_js_1.Keypair.generate();
    const solanaConnection = new web3_js_1.Connection(HTTP_ENDPOINT, { wsEndpoint: WSS_ENDPOINT });
    const walletData = {
        name: name,
        balance: 0,
        // publicKey: keypair.publicKey.toBase58(),
        publicKey: keypair.publicKey,
        // secretKey: Array.from(keypair.secretKey),
        secretKey: keypair.secretKey,
    };
    let wallets = getWallets();
    wallets.push(walletData);
    writeToDB(wallets);
    console.log(`New wallet created with '${name}' name!`);
}
exports.createWallet = createWallet;
function getWalletBalance(walletName) {
    let wallets = getWallets();
    let theWallet = wallets.find(wallet => wallet.name === walletName);
    let PUBLIC_KEY;
    try {
        PUBLIC_KEY = new web3_js_1.PublicKey(theWallet.publicKey);
    }
    catch (e) {
        console.log(`Wallet named '${walletName}' does not exists!`);
        return;
    }
    const solanaConnection = new web3_js_1.Connection(HTTP_ENDPOINT, { wsEndpoint: WSS_ENDPOINT });
    (() => __awaiter(this, void 0, void 0, function* () {
        let balance = yield solanaConnection.getBalance(PUBLIC_KEY);
        console.log(`SOLANA_WALLET balance is ${balance / web3_js_1.LAMPORTS_PER_SOL} Sol`);
        return;
    }))();
}
exports.getWalletBalance = getWalletBalance;
function updateWallet(walletIndex, walletData) {
    let wallets = getWallets();
    wallets[walletIndex] = walletData;
    writeToDB(wallets);
    console.log(`Updated '${wallets[walletIndex].name}' wallet!`);
}
function airdrop(walletName, amount) {
    const amountToAirdrop = amount === '' ? web3_js_1.LAMPORTS_PER_SOL : Number(amount);
    let wallets = getWallets();
    console.log(amount);
    let theWallet = wallets.find(wallet => wallet.name === walletName);
    let PUBLIC_KEY;
    try {
        PUBLIC_KEY = new web3_js_1.PublicKey(theWallet.publicKey);
    }
    catch (e) {
        console.log(`Wallet named '${walletName}' does not exists!`);
        return;
    }
    const solanaConnection = new web3_js_1.Connection(HTTP_ENDPOINT, { wsEndpoint: WSS_ENDPOINT });
    const sleep = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };
    (() => __awaiter(this, void 0, void 0, function* () {
        const subscriptionId = yield solanaConnection.onAccountChange(PUBLIC_KEY, (updatedAccountInfo) => console.log(`---Event Notification for ${PUBLIC_KEY.toString()}--- \nNew Account Balance:`, updatedAccountInfo.lamports / web3_js_1.LAMPORTS_PER_SOL, ' SOL'), "confirmed");
        console.log('Starting web socket, subscription ID: ', subscriptionId);
        yield sleep(10000); //Wait 10 seconds for Socket Testing
        yield solanaConnection.requestAirdrop(PUBLIC_KEY, amountToAirdrop);
        yield sleep(10000); //Wait 10 for Socket Testing
        yield solanaConnection.removeAccountChangeListener(subscriptionId);
        console.log(`Websocket ID: ${subscriptionId} closed.`);
    }))();
}
exports.airdrop = airdrop;
function transfer(senderWalletName, receiverWalletName, amount) {
    let wallets = getWallets();
    let senderWallet = wallets.find(wallet => wallet.name === senderWalletName);
    let receiverWallet = wallets.find(wallet => wallet.name === receiverWalletName);
    const amountToSend = amount === '' ? web3_js_1.LAMPORTS_PER_SOL : Number(amount);
    if (senderWallet === undefined) {
        // Handle the case where the wallet is not found
        // For example, throw an error or return early
        throw new Error("Wallet not found");
    }
    let fromPubKey;
    let toPubKey;
    try {
        fromPubKey = new web3_js_1.PublicKey(senderWallet.publicKey);
    }
    catch (e) {
        console.log(`Wallet named '${senderWalletName}' does not exists!`);
        return;
    }
    try {
        toPubKey = new web3_js_1.PublicKey(receiverWallet.publicKey);
    }
    catch (e) {
        console.log(`Wallet named '${receiverWalletName}' does not exists!`);
        return;
    }
    const solanaConnection = new web3_js_1.Connection(HTTP_ENDPOINT, { wsEndpoint: WSS_ENDPOINT });
    const sleep = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    };
    getWalletBalance(senderWalletName);
    getWalletBalance(receiverWalletName);
    (() => __awaiter(this, void 0, void 0, function* () {
        const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: fromPubKey,
            toPubkey: toPubKey,
            lamports: amountToSend,
        }));
        const signature = yield (0, web3_js_1.sendAndConfirmTransaction)(solanaConnection, transaction, [senderWallet]);
        console.log('SIGNATURE', signature);
    }))();
}
exports.transfer = transfer;
