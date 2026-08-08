import crypto from 'crypto';

export const generateOrderNumber = (): string => {
  // Generate a high-entropy, un-guessable 8-character order token e.g. RK-A4F9-82B1
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `RK-${part1}-${part2}`;
};
