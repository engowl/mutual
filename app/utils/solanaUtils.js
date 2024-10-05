import * as metaplex from '@metaplex-foundation/js';
import * as solanaWeb3 from '@solana/web3.js';

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

  const tokenData = {
    address: token.mint.address.toBase58(),
    name: token.name,
    symbol: token.symbol,
    decimals: token.mint.decimals,
    uri: token.uri || '',
    description: token?.json?.description || '',
    image: token?.json?.image || '',
    totalSupply: token.mint.supply.basisPoints.toString(),
  };

  return tokenData;
};
