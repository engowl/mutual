const { Connection, PublicKey } = require('@solana/web3.js');
const anchor = require('@coral-xyz/anchor');
const dotenv = require('dotenv');
const { MUTUAL_ESCROW_IDL } = require('../idl/mutual-escrow');

dotenv.config();

const PROGRAM_ID = process.env.PROGRAM_ID;
const RPC_URL = process.env.RPC_URL || "https://api.mainnet-beta.solana.com";

// Create a connection to the Solana network
const connection = new Connection(RPC_URL, 'confirmed');

// Create a new anchor provider
const provider = new anchor.AnchorProvider(
  connection,
  new anchor.Wallet(anchor.web3.Keypair.generate()),
  { commitment: 'confirmed' }
);

// Create the program interface
const program = new anchor.Program(MUTUAL_ESCROW_IDL, new PublicKey(PROGRAM_ID), provider);

// Extract event names from IDL
const eventNames = MUTUAL_ESCROW_IDL.events.map(event => event.name);
console.log('Available events:', eventNames);

// Function to parse and log event data
function parseEventData(eventName, data) {
  const event = MUTUAL_ESCROW_IDL.events.find(e => e.name === eventName);
  if (!event) {
    console.error(`Unknown event: ${eventName}`);
    return;
  }

  const decodedData = {};
  event.fields.forEach((field, index) => {
    decodedData[field.name] = data[index];
  });

  console.log(`${eventName} event:`, JSON.stringify(decodedData, null, 2));
}

// Main execution
(async () => {
  console.log(`Listening for events from program: ${PROGRAM_ID}`);
  console.log(`Connected to RPC URL: ${RPC_URL}`);

  try {
    // Set up listener for all program events
    // program.addEventListener('DealCreated', (event, slot, signature) => {
    //   console.log('New event detected:', event);
    //   console.log('Event name:', event.name);
    //   console.log('Slot:', slot);
    //   console.log('Transaction signature:', signature);

    //   parseEventData(event.name, event.data);
    // });


    eventNames.forEach((eventName) => {
      program.addEventListener(eventName, (event, slot, signature) => {
        console.log(`\n\n========== ${eventName} event ==========`)
        console.log('New event detected:', event);
        console.log('Event name:', eventName);
        console.log('Slot:', slot);
        console.log('Transaction signature:', signature);
        console.log(`==============================`)

        // parseEventData(event.name, event.data);
      });
    });
    console.log('Event listener set up successfully. Waiting for events...');
  } catch (error) {
    console.error('Error setting up event listener:', error);
  }

  // Keep the script running
  process.on('SIGINT', () => {
    console.log('Caught interrupt signal');
    program.removeEventListener();
    process.exit();
  });

  // Periodic check to ensure listener is still active
  setInterval(() => {
    console.log('Listener still active. Waiting for events...');
  }, 60000); // Log every minute
})();