import { VESTING_CONFIG } from "../../config.js";

export const validateVestingCondition = (vestingType, vestingCondition) => {
  const vestingOption = VESTING_CONFIG.find(option => option.id === vestingType);

  // If vestingType is invalid
  if (!vestingOption) {
    return {
      isValid: false,
      message: `Invalid vesting type: ${vestingType}. Allowed types are: ${VESTING_CONFIG.map(option => option.id).join(', ')}.`,
    };
  }

  // For TIME-based vesting, check if vestingCondition has a valid vestingDuration
  if (vestingType === 'TIME') {
    if (vestingCondition && vestingCondition.vestingDuration && vestingOption.conditions.includes(vestingCondition.vestingDuration)) {
      return { isValid: true, message: 'Valid vesting condition' };
    } else {
      return {
        isValid: false,
        message: `Invalid vestingCondition format for TIME. Expected format: { vestingDuration: '1-month' }. Allowed durations are: ${vestingOption.conditions.join(', ')}.`,
      };
    }
  }

  // For MARKETCAP-based vesting, check if vestingCondition has a valid marketcapThreshold
  if (vestingType === 'MARKETCAP') {
    const threshold = vestingCondition?.marketcapThreshold;
    const isPredefined = vestingOption.conditions.includes(Number(threshold));
    const isCustom = vestingOption.allowCustom && Number(threshold) > 0;

    if (threshold && (isPredefined || isCustom)) {
      return { isValid: true, message: isPredefined ? 'Valid predefined market cap threshold' : 'Valid custom market cap threshold' };
    } else {
      return {
        isValid: false,
        message: `Invalid vestingCondition format for MARKETCAP. Expected format: { marketcapThreshold: 1000000 }. Predefined thresholds are: ${vestingOption.conditions.join(', ')}, or provide a positive custom value.`,
      };
    }
  }

  // For NONE vesting, the vestingCondition should be an empty object
  if (vestingType === 'NONE') {
    if (!vestingCondition || Object.keys(vestingCondition).length === 0) {
      return { isValid: true, message: 'No vesting condition required for NONE type' };
    } else {
      return {
        isValid: false,
        message: 'Invalid vestingCondition format for NONE. Expected an empty object: {}.',
      };
    }
  }

  // Default error case
  return { isValid: false, message: 'Invalid vesting condition' };
};
