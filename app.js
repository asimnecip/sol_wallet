"use strict";
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
const web3_js_1 = require("@solana/web3.js");
const WSS_ENDPOINT = 'wss://api.testnet.solana.com/';
const HTTP_ENDPOINT = 'https://api.testnet.solana.com'; // replace with your URL
const solanaConnection = new web3_js_1.Connection(HTTP_ENDPOINT, { wsEndpoint: WSS_ENDPOINT });
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
(() => __awaiter(void 0, void 0, void 0, function* () {
    const ACCOUNT_TO_WATCH = new web3_js_1.PublicKey('5ncPmEfCbKTWHcPhmbQnzcUZQmgQfzFSxzcV1p2hcZM6'); // Replace with your own Wallet Address
    const subscriptionId = yield solanaConnection.onAccountChange(ACCOUNT_TO_WATCH, (updatedAccountInfo) => console.log(`---Event Notification for ${ACCOUNT_TO_WATCH.toString()}--- \nNew Account Balance:`, updatedAccountInfo.lamports / web3_js_1.LAMPORTS_PER_SOL, ' SOL'), "confirmed");
    console.log('Starting web socket, subscription ID: ', subscriptionId);
    yield sleep(10000); //Wait 10 seconds for Socket Testing
    yield solanaConnection.requestAirdrop(ACCOUNT_TO_WATCH, web3_js_1.LAMPORTS_PER_SOL);
    yield sleep(10000); //Wait 10 for Socket Testing
    yield solanaConnection.removeAccountChangeListener(subscriptionId);
    console.log(`Websocket ID: ${subscriptionId} closed.`);
}))();
