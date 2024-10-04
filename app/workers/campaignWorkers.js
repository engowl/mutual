import bs58 from 'bs58';
import solanaWeb3 from '@solana/web3.js';
import { CHAINS } from '../../config.js';
import { MUTUAL_ESCROW_PROGRAM } from '../lib/contract/contracts.js';
import { getAlphanumericId } from '../utils/miscUtils.js';
import { parseEventData } from '../utils/contractUtils.js';
import { prismaClient } from '../db/prisma.js';

/**
 *
 * @param {import("fastify").FastifyInstance} app
 * @param {*} _
 * @param {Function} done
 */
export const campaignWorkers = (app, _, done) => {
  const parseKp = () => {
    const kp = [];  // Fill this with your keypair data
    const keypair = solanaWeb3.Keypair.fromSecretKey(bs58.decode(bs58.encode(Buffer.from(kp))));

    console.group('Keypair Details');
    console.log('Address:', keypair.publicKey.toBase58());
    console.log('Secret Key (Base58):', bs58.encode(keypair.secretKey));
    console.groupEnd();
  };

  const saveEscrowEventLog = async ({
    chainId,
    programId,
    eventName,
    signature,
    parsedEvent,
  }) => {
    try {
      await prismaClient.escrowEventLog.create({
        data: {
          chainId: chainId,
          programId: programId,
          campaignOrderId: parsedEvent.orderId,
          eventName: eventName,
          signature: signature,
          data: parsedEvent,
        }
      })
      console.log('Escrow event log saved successfully');
    } catch (error) {
      console.error('Error saving escrow event log:', error.stack || error);
    }
  }

  // Listen for Escrow Contract events
  const listenForEvents = async () => {
    for (const chain of CHAINS) {
      try {
        const program = MUTUAL_ESCROW_PROGRAM(chain.id);
        const eventNames = program.idl.events.map((e) => e.name);

        console.group(`Listening for events on chain ${chain.id}`);
        console.log('Detected event names:', eventNames);
        console.groupEnd();

        eventNames.forEach((eventName) => {
          program.addEventListener(eventName, (event, slot, signature) => {
            console.group(`Event: ${eventName}`);
            console.log(`New event detected: ${eventName}`);
            console.log('Event data:', event);
            console.log('Slot:', slot);
            console.log('Transaction signature:', signature);
            console.groupEnd();

            // Parse the event data
            const parsedEvent = parseEventData(event, program.idl.events.find((e) => e.name === eventName));
            console.log('New Event Detected:', {
              name: eventName,
              signature: signature,
              data: parsedEvent,
            });

            // Save the event log
            saveEscrowEventLog({
              chainId: chain.id,
              programId: program.programId.toBase58(),
              eventName: eventName,
              signature: signature,
              parsedEvent: parsedEvent,
            });
          });
        });
      } catch (error) {
        console.error(`Error listening for escrow events on chain ${chain.id}:`, error.stack || error);
      }
    }
  };

  // Graceful Shutdown: Ensure proper cleanup on exit
  const handleExit = () => {
    console.log('\nGracefully shutting down the event listeners...');
    process.exit(0);
  };

  process.on('SIGINT', handleExit);  // Handle CTRL+C
  process.on('SIGTERM', handleExit); // Handle termination signal

  // Start listening for events
  listenForEvents();

  done();
};

