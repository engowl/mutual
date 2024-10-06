import { customAlphabet, nanoid } from "nanoid";

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const alphanumericNanoid = customAlphabet(alphabet, 16);

// custom alphabet, alphanumeric
export const getAlphanumericId = (length = 16) => {
  return alphanumericNanoid(length);
}

export const manyMinutesFromNowUnix = (minutes) => {
  return Math.floor(Date.now() / 1000) + 60 * minutes;
}