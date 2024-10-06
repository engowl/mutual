import { ThirdwebStorage } from "@thirdweb-dev/storage";

const storage = new ThirdwebStorage({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
  secretKey: import.meta.env.VITE_THIRDWEB_SECRET_KEY
});

export function extractCID(uri) {
  if (!uri) return null;

  // Check if the URI contains "ipfs://" scheme
  if (uri.startsWith("ipfs://")) {
    return uri.split("ipfs://")[1];
  }

  // Check if the URI is an HTTP(S) link and contains /ipfs/<cid>
  const ipfsPath = uri.match(/\/ipfs\/([a-zA-Z0-9]+)/);
  if (ipfsPath && ipfsPath[1]) {
    return ipfsPath[1];
  }

  // CID not found
  return null;
}

export const getIPFSData = async (link) => {
  const cid = extractCID(link);
  const data = await storage.download(`ipfs://${cid}`)
  
  return {
    uri: `ipfs://${cid}`,
    data: await data.json()
  };
}

export const ipfsConvertToThirdwebLink = async (link) => {
  const cid = extractCID(link);
  const _link = storage.resolveScheme(`ipfs://${cid}`)
  console.log('Thirdweb Link:', _link);
}

// ipfsConvertToThirdwebLink('https://ipfs.io/ipfs/Qma3yB7Ef6GhYAyjYEadGuLzFqRo8GbUH3cThau5BiagAG');

