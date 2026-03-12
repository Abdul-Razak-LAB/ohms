import pino from "pino";

const redactions = {
  paths: [
    "req.headers.authorization",
    "req.headers.cookie",
    "password",
    "passwordHash",
    "token",
    "tokenHash",
    "secret"
  ],
  censor: "[REDACTED]"
};

export const logger = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  redact: redactions
});
