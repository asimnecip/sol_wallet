import { createWallet, getWallets, getWalletBalance, WalletData, airdrop, transfer } from './wallet';

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

let networkSelected = false; 
let currentNetwork: string;

// Just for making it practical I converted the "finished" log into a function
function waitForEnter(callback: () => void) {
  readline.question("\nPress Enter to continue...", () => {
    callback();
  });
}

function showMenu() {
  let networkDescription;
  if (currentNetwork == "l") {
    networkDescription = "localhost";
  } else if (currentNetwork == "d") {
    networkDescription = "devnet";
  }

  // Displaying options to choose
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

async function main() {
  console.clear();

  if (!networkSelected) {
    // DO NOT FORGET! : A KEYPAIR ON LOCAL NETWORK DIFFERENT FROM DEVNET NETWORK, EVEN THOUGH IT IS IDENTICAL. 
    // WALLET CHANGES WHEN THE NETWORK CHANGES

    readline.question("Which network do you want to use? (d:devnet, l:local - default:devnet): ", (network: string) => {
      console.log(`You have selected the ${network}.`);
      currentNetwork = network;
      networkSelected = true; // Set to true after asking the network question
      console.clear();
      showMenu();
      handleMenuSelection(currentNetwork);
    });
  } else {
    showMenu();
    handleMenuSelection(currentNetwork);
  }
}

// This function will be called everytime when the user finished her/his process
function handleMenuSelection(network: string) {
  readline.question("Select an option: ", (option: string) => {
    switch (option) {
      case '1':
        let wallets = getWallets();
        console.log("\nAvailable wallets:");
        wallets.forEach((wallet: WalletData, _: number) => {
          console.log(`Name: ${wallet.name}, Balance: ${wallet.balance}`);
        });
        waitForEnter(main);
        break;
      case '2':
        readline.question("\nEnter New Wallet Name: ", (name: string) => {
          createWallet(name);
          waitForEnter(main);
        });
        break;
      case '3':
        readline.question("\nEnter wallet Name: ", async (walletName: string) => {
          await getWalletBalance(walletName, network, () => waitForEnter(main));
        });
        break;
      case '4':
        readline.question("\nEnter wallet Name to airdrop: ", async (walletName: string) => {
          readline.question("Airdrop amount (default:1): ", async (amount: string) => {
            await airdrop(walletName, amount, network, () => waitForEnter(main));
          });
        });
        break;
      case '5':
        readline.question("\nEnter sender wallet's Name: ", async (senderWalletName: string) => {
          readline.question("Enter receiver wallet's Name: ", async (receiverWalletName: string) => {
            readline.question("Enter amount: ", async (amount: string) => {
              await transfer(
                senderWalletName,
                receiverWalletName,
                amount,
                network,
                () => waitForEnter(main)
              );
            });
          });
        });
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
