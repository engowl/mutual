import { customAlphabet, nanoid } from "nanoid";

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const alphanumericNanoid = customAlphabet(alphabet, 16);

// custom alphabet, alphanumeric
export const getAlphanumericId = (length = 16) => {
  return alphanumericNanoid(length);
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const toHexString = (buffer) =>
  buffer.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");

// Convert Buffer { type: 'Buffer', data: [ 1, 2, 3, 4, 5, 6, 7, 8 ] } to Uint8Array
export const bufferToUint8Array = (buffer) => new Uint8Array(buffer.data);

export const shortenId = (id, start = 3, end = 3) => {
  return `${id.slice(0, start)}...${id.slice(-end)}`;
};

export const manyMinutesFromNowUnix = (minutes) => {
  return Math.floor(Date.now() / 1000) + 60 * minutes;
}

// Get tweetId from tweet URL
export const getTweetIdFromUrl = (url) => {
  const tweetId = url.split("/").pop();
  return tweetId;
}