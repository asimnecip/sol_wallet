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
const wallet_1 = require("./wallet");
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
let networkSelected = false;
let currentNetwork;
function waitForEnter(callback) {
    readline.question("\nPress Enter to continue...", () => {
        callback();
    });
}
function showMenu() {
    let networkDescription;
    if (currentNetwork == "l") {
        networkDescription = "localhost";
    }
    else if (currentNetwork == "d") {
        networkDescription = "devnet";
    }
    console.log(`

  -*- You are on ${networkDescription} network -*-

  Choose an option:
  1. List wallets
  2. Create wallet
  3. Get balance of a wallet
  4. Airdrop to a wallet
  5. Transfer between wallets
  0. Exit
`);
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.clear();
        if (!networkSelected) {
            readline.question("Which network do you want to use? (d:devnet, l:local - default:devnet): ", (network) => {
                console.log(`You have selected the ${network}.`);
                currentNetwork = network;
                networkSelected = true; // Set to true after asking the network question
                console.clear();
                showMenu();
                handleMenuSelection(currentNetwork);
            });
        }
        else {
            showMenu();
            handleMenuSelection(currentNetwork);
        }
    });
}
function handleMenuSelection(network) {
    readline.question("Select an option: ", (option) => {
        switch (option) {
            case '1':
                let wallets = (0, wallet_1.getWallets)();
                console.log("\nAvailable wallets:");
                wallets.forEach((wallet, _) => {
                    console.log(`Name: ${wallet.name}, Balance: ${wallet.balance}`);
                });
                waitForEnter(main);
                break;
            case '2':
                readline.question("\nEnter New Wallet Name: ", (name) => {
                    (0, wallet_1.createWallet)(name);
                    waitForEnter(main);
                });
                break;
            case '3':
                readline.question("\nEnter wallet Name: ", (walletName) => __awaiter(this, void 0, void 0, function* () {
                    yield (0, wallet_1.getWalletBalance)(walletName, network, () => waitForEnter(main));
                }));
                break;
            case '4':
                readline.question("\nEnter wallet Name to airdrop: ", (walletName) => __awaiter(this, void 0, void 0, function* () {
                    readline.question("Airdrop amount (default:1): ", (amount) => __awaiter(this, void 0, void 0, function* () {
                        yield (0, wallet_1.airdrop)(walletName, amount, network, () => waitForEnter(main));
                    }));
                }));
                break;
            case '5':
                readline.question("\nEnter sender wallet's Name: ", (senderWalletName) => __awaiter(this, void 0, void 0, function* () {
                    readline.question("Enter receiver wallet's Name: ", (receiverWalletName) => __awaiter(this, void 0, void 0, function* () {
                        readline.question("Enter amount: ", (amount) => __awaiter(this, void 0, void 0, function* () {
                            yield (0, wallet_1.transfer)(senderWalletName, receiverWalletName, amount, network, () => waitForEnter(main));
                        }));
                    }));
                }));
                break;
            case '0':
                console.log("Exiting...");
                readline.close();
                return;
            default:
                console.log("Invalid option. Please try again.");
                waitForEnter(main);
                break;
        }
    });
}
main();
