import { Connection } from "@solana/web3.js";
import { CHAINS } from "../../../config.js";
import { MUTUAL_ESCROW_PROGRAM } from "./contracts.js";
import { parseAccountData } from "../../utils/contractUtils.js";


export const getCreateDealTxDetails = async (txHash, chainId) => {
  const chain = CHAINS.find(c => c.id === chainId);
  if (!chain) {
    throw new Error('Chain not found');
  }

  console.log(`Fetching transaction details for txHash: ${txHash} on chain: ${chainId}`);

  const program = MUTUAL_ESCROW_PROGRAM(chainId);

  const connection = new Connection(chain.rpcUrl, 'confirmed');
  const tx = await connection.getParsedTransaction(txHash);

  const createDealIx = tx.transaction.message.instructions.filter(i => i.programId.toBase58() === program.programId.toBase58());
  const createDealAccounts = createDealIx[0].accounts

  // 2nd account is the deal account
  const dealAccount = createDealAccounts[1];

  // Get the deal account data
  const dealAccountData = await program.account.deal.fetch(dealAccount);
  const schema = program.idl.accounts.find(a => a.name === 'Deal');
  const parsedAccountData = parseAccountData(dealAccountData, schema);

  console.log('Parsed Account Data:', parsedAccountData);

  return parsedAccountData;
}