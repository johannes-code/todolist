const isDev = process.env.NODE_ENV === "development";

export const log = (...args) => {
  if (isDev) console.log(...args);
};

export const logError = (...args) => {
  console.error(...args);
};
