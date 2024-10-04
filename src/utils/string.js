// address shorterner util function

export const shortenAddress = (address, startChars = 4, endChars = 4) => {
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};
