import { Header, Payload, SIWS } from "@web3auth/sign-in-with-solana";

const domain = import.meta.env.PROD ? "localhost" : "localhost";
const origin = import.meta.env.PROD
  ? "https://localhost:3000"
  : "https://localhost:3000";

export function createSolanaMessage(address, statement) {
  const header = new Header();
  header.t = "sip99";

  const payload = new Payload();
  payload.domain = domain;
  payload.address = address;
  payload.uri = origin;
  payload.statement = statement;
  payload.version = "1";
  payload.chainId = import.meta.env.PROD ? "solana:mainnet" : "solana:devnet";

  const message = new SIWS({
    header,
    payload,
  });

  return message.prepareMessage();
}
