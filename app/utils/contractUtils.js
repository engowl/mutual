import { PublicKey } from '@solana/web3.js';

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
      parsedEvent[fieldName] = Number(fieldValue);

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