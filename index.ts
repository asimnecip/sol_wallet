import { createWallet, getWallets, getWalletBalance, WalletData, airdrop, transfer } from './wallet';

// createWallet("FirstWalletOfMyLifeThatIsSaved");

function waitForEnter(callback: () => void) {
  readline.question("\nPress Enter to continue...", () => {
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
  
  async function main() {
    console.clear();
    showMenu();
    readline.question("Select an option: ", (option: string) => {
      switch (option) {
        case '1':
          let wallets = getWallets();
          console.log("\nAvailable wallets:");
          wallets.forEach((wallet:WalletData, id:number) => {
            console.log(`Name: ${wallet.name}, Balance: ${wallet.balance}`);
          });
          waitForEnter(main);
          break;
        case '2':
          readline.question("\nEnter New Wallet Name: ", (name:string) => {
            createWallet(name);
            waitForEnter(main); 
        });
          break;
        case '3':
          readline.question("\nEnter wallet Name: ", async (walletName:string) => {
            await getWalletBalance(walletName, () => waitForEnter(main));
          });
          break;
        case '4':
            readline.question("\nEnter wallet Name to airdrop: ", async (walletName:string) => {
              readline.question("Airdrop amount (default:1): ", async (amount:string) => {
                await airdrop(walletName, amount, () => waitForEnter(main));
              });
            });
          waitForEnter(main); 
          break;
      case '5':
          readline.question("\nEnter sender wallet's Name: ", async (senderWalletName:string) => {
            readline.question("Enter receiver wallet's Name: ", async (receiverWalletName:string) => {
              readline.question("Enter amount: ", async (amount:string) => {
                await transfer(
                  senderWalletName=senderWalletName,
                  receiverWalletName=receiverWalletName,
                  amount=amount,
                  () => waitForEnter(main)
                  );
              });
            });
          });
          waitForEnter(main);
          break; 
        case '0':
          console.log("Exiting...");
          readline.close();
          return;
        default:
          console.log("Invalid option. Please try again.");
          waitForEnter(main)
          break;
      }
    });
  }
  
  main();