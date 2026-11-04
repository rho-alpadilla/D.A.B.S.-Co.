export const DEFAULT_PICKUP_SETTINGS = Object.freeze({
  location: 'Quezon City',
  instructions: 'Schedule via chat.',
});

export const DEFAULT_BANK_TRANSFER_DETAILS = Object.freeze({
  bankName: 'BDO Unibank',
  accountName: 'DABS Co. (D-A-B-S Company)',
  accountNumber: '0012-3456-7890-1234',
});

const getTrimmedText = (value) => (typeof value === 'string' ? value.trim() : '');

export const normalizePickupSettings = (value) => ({
  location: getTrimmedText(value?.location) || DEFAULT_PICKUP_SETTINGS.location,
  instructions: getTrimmedText(value?.instructions) || DEFAULT_PICKUP_SETTINGS.instructions,
});

export const normalizeBankTransferDetails = (value) => ({
  bankName: getTrimmedText(value?.bankName) || DEFAULT_BANK_TRANSFER_DETAILS.bankName,
  accountName: getTrimmedText(value?.accountName) || DEFAULT_BANK_TRANSFER_DETAILS.accountName,
  accountNumber: getTrimmedText(value?.accountNumber) || DEFAULT_BANK_TRANSFER_DETAILS.accountNumber,
});
