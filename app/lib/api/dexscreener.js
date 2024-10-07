
import axios from "axios";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { sleep } from "../../utils/miscUtils.js";

const BASE_URL = "https://api.dexscreener.com/latest";

const validateChain = (chain) => {
  const supportedChains = ["ethereum", "base", "solana"];
  if (!supportedChains.includes(chain)) {
    const errorMsg = `Invalid chain. Supported chains are ${supportedChains.join(", ")}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
};

const DexscreenerRateLimiter = new RateLimiterMemory({
  duration: 30,
  points: 250
});

let lock = null;

const acquireLock = async () => {
  while (lock) {
    await lock;
  }
  let resolveLock;
  lock = new Promise(resolve => resolveLock = resolve);
  return resolveLock;
};

const releaseLock = (resolveLock) => {
  resolveLock();
  lock = null;
};

const fetchData = async (url) => {
  const resolveLock = await acquireLock();

  try {
    await DexscreenerRateLimiter.consume(1);
  } catch (error) {
    console.error(`Rate limit exceeded for Dexscreener API. Waiting for ${error.msBeforeNext}ms before next request.`);
    await sleep(error.msBeforeNext);
  }

  try {
    const res = await axios({
      method: 'GET',
      url: url,
      headers: {
        "Content-Type": "application/json"
      }
    });

    return res.data;
  } catch (err) {
    console.error(`Error fetching data from Dexscreener API: ${err.message}`);
    throw new Error(err);
  } finally {
    await sleep(1000);
    releaseLock(resolveLock);
  }
};

export const dexscreenerGetPairs = async ({
  chain,
  pairAddresses
}) => {
  validateChain(chain);

  if(pairAddresses > 30 || pairAddresses < 1) {
    const errorMsg = `Invalid pairAddresses. pairAddresses must be between 1 and 30`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const url = `${BASE_URL}/dex/pairs/${chain}/${pairAddresses.join(",")}`;
  const data = await fetchData(url);

  return data;
}

export const dexscreenerGetTokens = async ({
  tokenAddresses
}) => {
  if(tokenAddresses.length > 30 || tokenAddresses.length < 1) {
    const errorMsg = `Invalid tokenAddresses. tokenAddresses must be between 1 and 30`;
    console.error('dexscreenerGetTokens', errorMsg);
    throw new Error(errorMsg);
  }

  const url = `${BASE_URL}/dex/tokens/${tokenAddresses.join(",")}`;
  const data = await fetchData(url);

  return data;
}

export const dexscreenerSearch = async ({
  query 
}) => {
  const url = `${BASE_URL}/dex/search?q=${query}`;
  const data = await fetchData(url);

  return data;
}