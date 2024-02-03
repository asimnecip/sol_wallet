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
const WSS_ENDPOINT = 'wss://api.testnet.solana.com/';
const HTTP_ENDPOINT = 'https://api.testnet.solana.com';
function writeToDB(wallets) {
    fs.writeFileSync(FILE_PATH, JSON.stringify(wallets, null, 2), { encoding: 'utf8' });
}
function updateWallet(walletIndex, walletData) {
    let wallets = getWallets();
    wallets[walletIndex] = walletData;
    writeToDB(wallets);
    console.log(`Updated '${wallets[walletIndex].name}' wallet!`);
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
    const walletData = {
        name: name,
        balance: 0,
        publicKey: keypair.publicKey.toBase58(),
        // publicKey: keypair.publicKey,
        secretKey: Array.from(keypair.secretKey),
        // secretKey: keypair.secretKey,
    };
    let wallets = getWallets();
    wallets.push(walletData);
    writeToDB(wallets);
    console.log(`New wallet created with '${name}' name!`);
}
exports.createWallet = createWallet;
function getWalletBalance(walletName, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        let wallets = getWallets();
        let theWallet = wallets.find(wallet => wallet.name === walletName);
        if (!theWallet) {
            console.log(`Wallet named '${walletName}' does not exists!`);
            callback();
            return;
        }
        try {
            const PUBLIC_KEY = new web3_js_1.PublicKey(theWallet.publicKey);
            const solanaConnection = new web3_js_1.Connection(HTTP_ENDPOINT, { wsEndpoint: WSS_ENDPOINT });
            let balance = yield solanaConnection.getBalance(PUBLIC_KEY);
            console.log(`Balance of ${walletName} wallet is ${balance / web3_js_1.LAMPORTS_PER_SOL} Sol`);
        }
        catch (e) {
            console.log(`Error getting balance for '${walletName}': ${e}`);
        }
        finally {
            callback();
        }
    });
}
exports.getWalletBalance = getWalletBalance;
function airdrop(walletName, amount, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const amountToAirdrop = amount === '' ? web3_js_1.LAMPORTS_PER_SOL : Number(amount);
        let wallets = getWallets();
        let theWallet = wallets.find(wallet => wallet.name === walletName);
        if (!theWallet) {
            console.log(`Wallet named '${walletName}' does not exists!`);
            callback();
            return;
        }
        const sleep = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        };
        try {
            const PUBLIC_KEY = new web3_js_1.PublicKey(theWallet.publicKey);
            const solanaConnection = new web3_js_1.Connection(HTTP_ENDPOINT, { wsEndpoint: WSS_ENDPOINT });
            (() => __awaiter(this, void 0, void 0, function* () {
                const subscriptionId = yield solanaConnection.onAccountChange(PUBLIC_KEY, (updatedAccountInfo) => console.log(`---Event Notification for ${PUBLIC_KEY.toString()}--- \nNew Account Balance:`, updatedAccountInfo.lamports / web3_js_1.LAMPORTS_PER_SOL, ' SOL'), "confirmed");
                console.log('Starting web socket, subscription ID: ', subscriptionId);
                yield sleep(5000);
                yield solanaConnection.requestAirdrop(PUBLIC_KEY, amountToAirdrop);
                yield sleep(5000);
                yield solanaConnection.removeAccountChangeListener(subscriptionId);
                console.log(`Websocket ID: ${subscriptionId} closed.`);
            }))();
        }
        catch (e) {
            if (e instanceof Error && e.message.includes('429')) {
                console.log("You have requested too many airdrops. Please wait 24 hours before trying again.");
            }
            else {
                console.log(`Error while airdropping to '${walletName}': ${e}`);
            }
        }
        finally {
            callback();
        }
    });
}
exports.airdrop = airdrop;
function transfer(senderWalletName, receiverWalletName, amount, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        let wallets = getWallets();
        let senderWallet = wallets.find(wallet => wallet.name === senderWalletName);
        let receiverWallet = wallets.find(wallet => wallet.name === receiverWalletName);
        const amountToSend = amount === '' ? web3_js_1.LAMPORTS_PER_SOL : Number(amount);
        if (!senderWallet) {
            console.log(`Wallet named '${senderWalletName}' does not exists!`);
            callback();
            return;
        }
        else if (!receiverWallet) {
            console.log(`Wallet named '${receiverWalletName}' does not exists!`);
            callback();
            return;
        }
        try {
            const fromPubKey = new web3_js_1.PublicKey(senderWallet.publicKey);
            const toPubKey = new web3_js_1.PublicKey(receiverWallet.publicKey);
            const solanaConnection = new web3_js_1.Connection(HTTP_ENDPOINT, { wsEndpoint: WSS_ENDPOINT });
            // Doğrudan json'daki wallet'ı kullanmak sorun oluşturdu, keypair'i rebuild etmek tek çözüm!
            const senderSecretKeyUint8Array = new Uint8Array(senderWallet.secretKey);
            const senderKeypair = web3_js_1.Keypair.fromSecretKey(senderSecretKeyUint8Array);
            (() => __awaiter(this, void 0, void 0, function* () {
                let transaction = new web3_js_1.Transaction();
                transaction.add(web3_js_1.SystemProgram.transfer({
                    fromPubkey: fromPubKey,
                    toPubkey: toPubKey,
                    lamports: amountToSend / 100,
                }));
                const signature = yield (0, web3_js_1.sendAndConfirmTransaction)(solanaConnection, transaction, [senderKeypair]);
                console.log('SIGNATURE', signature);
            }))();
        }
        catch (e) {
            if (e instanceof Error && e.message.includes('429')) {
                console.log("You have requested too many airdrops. Please wait 24 hours before trying again.");
            }
            else {
                console.log(`Error while transfer: ${e}`);
            }
        }
        finally {
            callback();
        }
    });
}
exports.transfer = transfer;
