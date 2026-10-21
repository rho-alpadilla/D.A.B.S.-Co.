export const DEFAULT_PICKUP_SETTINGS = Object.freeze({
  location: 'Quezon City',
  instructions: 'Schedule via chat.',
});

const getTrimmedText = (value) => (typeof value === 'string' ? value.trim() : '');

export const normalizePickupSettings = (value) => ({
  location: getTrimmedText(value?.location) || DEFAULT_PICKUP_SETTINGS.location,
  instructions: getTrimmedText(value?.instructions) || DEFAULT_PICKUP_SETTINGS.instructions,
});
