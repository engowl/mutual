import { PublicKey } from '@solana/web3.js';
import { BN } from 'bn.js';
import { Buffer as Buffer2 } from 'buffer';

/**
 * 
 * @param {Object} event - The raw event object
 * @param {Object} eventSchema - The event schema from the IDL
 */
export const parseEventData = (event, eventSchema) => {
  const parsedEvent = {};

  eventSchema.fields.forEach(field => {
    const fieldName = field.name;
    const fieldType = field.type;
    const fieldValue = event[fieldName];

    if (fieldType === "publicKey") {
      parsedEvent[fieldName] = new PublicKey(fieldValue).toBase58();

    } else if (isFixedSizeArray(fieldType)) {
      parsedEvent[fieldName] = parseFixedSizeArray(fieldValue);

    } else if (["u64", "u32", "u16", "u8"].includes(fieldType)) {
      parsedEvent[fieldName] = String(fieldValue);

    } else if (fieldType === "bool") {
      parsedEvent[fieldName] = Boolean(fieldValue);

    } else if (typeof fieldType === 'object' && (fieldType.kind === 'enum' || isEnum(fieldValue))) {
      const enumValue = Object.keys(fieldValue)[0];
      parsedEvent[fieldName] = enumValue;

    } else if (typeof fieldType === 'object' && fieldType.kind === 'struct') {
      parsedEvent[fieldName] = parseEventData(fieldValue, fieldType);

    } else {
      console.warn(`Unrecognized type: ${JSON.stringify(fieldType)} for field ${fieldName}`);
      parsedEvent[fieldName] = fieldValue;
    }
  });

  return parsedEvent;
};

export const parseAccountData = (accountData, schema) => {
  const parsedData = {};

  schema.type.fields.forEach(field => {
    const fieldName = field.name;
    const fieldType = field.type;
    const fieldValue = accountData[fieldName];

    if (fieldType === "publicKey") {
      parsedData[fieldName] = new PublicKey(fieldValue).toBase58();
    } else if (typeof fieldType === 'object' && fieldType.array) {
      parsedData[fieldName] = parseFixedSizeArray(fieldValue);
    } else if (["u64", "u32", "u16", "u8", "i64", "i32", "i16", "i8"].includes(fieldType)) {
      parsedData[fieldName] = fieldValue instanceof BN ? fieldValue.toString() : fieldValue.toString();
    } else if (fieldType === "u8") {
      parsedData[fieldName] = fieldValue;
    } else if (typeof fieldType === 'object' && fieldType.defined) {
      parsedData[fieldName] = Object.keys(fieldValue)[0];
    } else {
      console.warn(`Unrecognized type: ${JSON.stringify(fieldType)} for field ${fieldName}`);
      parsedData[fieldName] = fieldValue;
    }
  });

  return parsedData;
};

// Helper function to check if a type is a fixed-size array
function isFixedSizeArray(type) {
  return typeof type === 'object' &&
    Object.prototype.hasOwnProperty.call(type, 'array') &&
    Array.isArray(type.array) &&
    type.array.length === 2 &&
    type.array[0] === 'u8' &&
    typeof type.array[1] === 'number';
}

// Helper function to parse fixed-size arrays (like orderId)
function parseFixedSizeArray(value) {
  if (Array.isArray(value) && value.every(item => typeof item === 'number')) {
    return new TextDecoder().decode(new Uint8Array(value)).replace(/\0/g, '');
  }
  return value;
}

// Helper function to check if a value is likely an enum
function isEnum(value) {
  return typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length === 1 &&
    (Object.values(value)[0] === null || isEmptyObject(Object.values(value)[0]));
}

// Helper function to check if an object is empty
function isEmptyObject(obj) {
  return typeof obj === 'object' &&
    obj !== null &&
    Object.keys(obj).length === 0;
}

// Helper function to handle client amount with decimals
export const calculateClientAmount = (tokenAmount, decimals) => {
  const [wholePart, fractionalPart] = tokenAmount.toString().split('.');

  // Handle the whole part as a BN
  const wholePartBN = new BN(wholePart);

  // Initialize fractional part BN to 0
  let fractionalPartBN = new BN(0);

  if (fractionalPart) {
    // Pad or truncate fractional part to match the token's decimals
    const fractionalStr = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
    fractionalPartBN = new BN(fractionalStr);
  }

  // Calculate the final client amount as a BN
  const clientAmount = wholePartBN.mul(new BN(10).pow(new BN(decimals))).add(fractionalPartBN);

  return clientAmount;
};

export const formatTokenAmount = (tokenAmount, tokenDecimals) => {
  // Create a BN instance from the tokenAmount
  const tokenAmountBN = new BN(tokenAmount);

  // Create the divisor as 10^tokenDecimals
  const divisor = new BN(10).pow(new BN(tokenDecimals));

  // Calculate the whole part by dividing the tokenAmount by the divisor
  const wholePartBN = tokenAmountBN.div(divisor);

  // Calculate the fractional part as the remainder of the division
  const fractionalPartBN = tokenAmountBN.mod(divisor);

  // Convert the whole part to a string
  const wholePartStr = wholePartBN.toString();

  // If there's no fractional part, return just the whole part
  if (fractionalPartBN.isZero()) {
    return wholePartStr;
  }

  // If there's a fractional part, format it correctly
  const fractionalPartStr = fractionalPartBN.toString().padStart(tokenDecimals, '0');

  // Remove any trailing zeros in the fractional part
  const trimmedFractionalPartStr = fractionalPartStr.replace(/0+$/, '');

  // Return the formatted string with both whole and fractional parts
  return `${wholePartStr}.${trimmedFractionalPartStr}`;
};

// Modified validateTokenAmount function
export const validateTokenAmount = (clientAmount, contractAmount, tokenDecimals) => {
  // Use the helper function to convert clientAmount properly with decimals
  const clientBN = calculateClientAmount(clientAmount, tokenDecimals);

  // Assuming contractAmount is already a string (from parsing account data)
  const contractBN = new BN(contractAmount);

  let isValid = false;
  let message = '';

  console.log({
    clientAmount: clientBN.toString(),
    contractAmount: contractBN.toString()
  });

  if (clientBN.eq(contractBN)) {
    isValid = true;
    message = 'Amount matches the contract.';
  } else if (clientBN.lt(contractBN)) {
    message = `Amount is smaller than expected. Provided: ${clientBN.toString()}, Expected: ${contractBN.toString()}`;
  } else {
    message = `Amount is larger than expected. Provided: ${clientBN.toString()}, Expected: ${contractBN.toString()}`;
  }

  return {
    isValid,
    message,
    clientAmount: clientBN.toString(),
    contractAmount: contractBN.toString()
  };
};


export function prepareOrderId(orderId) {
  let orderIdBuffer = Buffer.from(orderId, "utf-8");
  if (orderIdBuffer.length > 16) {
    orderIdBuffer = orderIdBuffer.slice(0, 16);
  } else if (orderIdBuffer.length < 16) {
    const padding = Buffer.alloc(16 - orderIdBuffer.length);
    orderIdBuffer = Buffer.concat([orderIdBuffer, padding], 16);
  }
  return orderIdBuffer;
}

export function prepareOrderId_2(orderId) {
  let orderIdBuffer = Buffer2.from(orderId, 'utf-8');
  if (orderIdBuffer.length > 16) {
    orderIdBuffer = orderIdBuffer.slice(0, 16);
  } else if (orderIdBuffer.length < 16) {
    const padding = Buffer2.alloc(16 - orderIdBuffer.length);
    orderIdBuffer = Buffer2.concat([orderIdBuffer, padding], 16);
  }
  return orderIdBuffer;
}