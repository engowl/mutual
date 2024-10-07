// address shorterner util function

export const shortenAddress = (address, startChars = 4, endChars = 4) => {
  try {
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
  } catch (error) {
    return address;
  }
};
