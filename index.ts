import { createWallet, getWallets, getWalletBalance, WalletData, airdrop } from './wallet';

// createWallet("FirstWalletOfMyLifeThatIsSaved");

function waitForEnter(callback: () => void) {
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
    readline.question("Select an option: ", (option: string) => {
      switch (option) {
        case '1':
          let wallets = getWallets();
          console.log("Available wallets:");
          wallets.forEach((wallet:WalletData, id:number) => {
            console.log(`ID: ${id}, Owner: ${wallet.name}, Balance: ${wallet.balance}`);
          });
          waitForEnter(main);
          break;
        case '2':
          readline.question("Enter New Wallet Name: ", (name:string) => {
            createWallet(name);
            waitForEnter(main); 
        });
          break;
        case '3':
          readline.question("Enter wallet Name: ", (walletName:string) => {
            getWalletBalance(walletName);
          });
          waitForEnter(main); 
          break;
        case '4':
            readline.question("Enter wallet Name to airdrop: ", (walletName:string) => {
              readline.question("Airdrop amount (default:1): ", (amount:string) => {
                airdrop(walletName, amount);
              });
            });
          waitForEnter(main); 
          break;
        case '5':
            readline.question("Enter sender wallet's Name: ", (walletName:string) => {
              getWalletBalance(walletName);
              readline.question("Enter receiver wallet's Name: ", (walletName:number) => {
                
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