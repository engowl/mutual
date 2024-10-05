import * as metaplex from '@metaplex-foundation/js';
import * as solanaWeb3 from '@solana/web3.js';
import { getIPFSData } from './ipfsUtils.js';
import BN from 'bn.js';

/**
 * Get the token info
 * @param {string} mintAddress - The mint address of the token
 * @param {Connection} connection - The Solana connection object
 * @returns {Promise<Object>} The token info
 */
export const getTokenInfo = async (mintAddress, connection) => {
  // Initialize Metaplex
  const _metaplex = metaplex.Metaplex.make(connection);

  // Get the metadata account
  const metadataAccount = _metaplex
    .nfts()
    .pdas()
    .metadata({ mint: new solanaWeb3.PublicKey(mintAddress) });

  const metadataAccountInfo = await connection.getAccountInfo(metadataAccount);
  if (!metadataAccountInfo) {
    throw new Error(`Metadata account not found for mint ${mintAddress}`);
  }

  // Fetch token metadata
  const token = await _metaplex.nfts().findByMint({ mintAddress: new solanaWeb3.PublicKey(mintAddress) });

  let tokenUri = token.uri;
  let uriData = null;
  if (token?.uri) {
    try {
      const ipfsData = await getIPFSData(token.uri);
      uriData = ipfsData.data;
    } catch (error) {
      console.error('Error fetching IPFS data:', error);
    }
  }

  // Calculate total supply, use bn.js to handle large numbers
  const formattedTotalSupply = new BN(token.mint.supply.basisPoints).div(new BN(10).pow(new BN(token.mint.decimals))).toNumber();

  const tokenData = {
    address: token.mint.address.toBase58(),
    name: token.name,
    symbol: token.symbol,
    decimals: token.mint.decimals,
    uri: tokenUri,
    description: uriData?.description || '',
    image: uriData?.image || '',
    totalSupply: formattedTotalSupply,
    uriData: uriData,
  };

  return tokenData;
};
