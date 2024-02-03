"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const wallet_1 = require("./wallet");
// createWallet("FirstWalletOfMyLifeThatIsSaved");
function waitForEnter(callback) {
    readline.question("Press Enter to continue...", () => {
        callback();
    });
}
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
function showMenu() {
    console.log(`
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
    console.clear();
    showMenu();
    readline.question("Select an option: ", (option) => {
        switch (option) {
            case '1':
                let wallets = (0, wallet_1.getWallets)();
                console.log("Available wallets:");
                wallets.forEach((wallet, id) => {
                    console.log(`ID: ${id}, Owner: ${wallet.name}, Balance: ${wallet.balance}`);
                });
                waitForEnter(main);
                break;
            case '2':
                readline.question("Enter New Wallet Name: ", (name) => {
                    (0, wallet_1.createWallet)(name);
                    waitForEnter(main);
                });
                break;
            case '3':
                readline.question("Enter wallet Name: ", (walletName) => {
                    (0, wallet_1.getWalletBalance)(walletName);
                });
                waitForEnter(main);
                break;
            case '4':
                readline.question("Enter wallet Name to airdrop: ", (walletName) => {
                    readline.question("Airdrop amount (default:1): ", (amount) => {
                        (0, wallet_1.airdrop)(walletName, amount);
                    });
                });
                waitForEnter(main);
                break;
            case '5':
                readline.question("Enter sender wallet's Name: ", (walletName) => {
                    (0, wallet_1.getWalletBalance)(walletName);
                    readline.question("Enter receiver wallet's Name: ", (walletName) => {
                    });
                    waitForEnter(main);
                });
            case '0':
                console.log("Exiting...");
                readline.close();
                return;
            default:
                console.log("Invalid option. Please try again.");
                break;
        }
    });
}
main();
