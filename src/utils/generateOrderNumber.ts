export const generateOrderNumber = (): string => {
  const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4 random digits
  return `RK-${randomDigits}`;
};
