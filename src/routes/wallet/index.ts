// Server
import { Hono } from "hono";

// Utils
import { PrivyClient } from "@privy-io/server-auth";

// Validation utils
import { logError400, logError500 } from "../../utils/log/error";

// Types
import { zValidator } from "@hono/zod-validator";

import { Env } from "../../utils/common/types";
import { WalletPhoneQuery, WalletPhoneQueryType } from "./types";

function isValidE164(phoneNumber: string): boolean {
  // E.164 format regex:
  // ^ - start of string
  // \+ - must start with plus sign
  // [1-9] - country code must start with non-zero digit
  // \d{1,14} - followed by 1-14 digits
  // $ - end of string
  // Total length (including +) must be between 3 and 16 characters
  const e164Regex = /^\+[1-9]\d{1,14}$/;

  if (!phoneNumber) {
    return false;
  }

  // Check if string matches regex pattern
  if (!e164Regex.test(phoneNumber)) {
    return false;
  }

  // Verify total length is between 3 and 16 characters (including the + prefix)
  if (phoneNumber.length < 3 || phoneNumber.length > 16) {
    return false;
  }

  return true;
}

export function walletRoutes(): Hono<{ Bindings: Env }> {
  // App
  const app = new Hono<{ Bindings: Env }>();

  app.get("/phone", zValidator("query", WalletPhoneQuery), async (c) => {
    // Structured logging setup. TODO: Add proper logging later.
    const logger = console;
    const startTime = Date.now();

    try {
      // Validate input parameters
      const { phoneNumber } = c.req.query() as WalletPhoneQueryType;

      if (!isValidE164(phoneNumber)) {
        return logError400(
          c,
          "VALIDATION_ERROR",
          "Invalid E164 phone number format",
          {
            expectedFormat: "E164 phone number",
            receivedValue: phoneNumber,
          }
        );
      }

      // Get wallet address
      const client = new PrivyClient(
        c.env.PRIVY_APP_ID,
        c.env.PRIVY_APP_SECRET
      );

      const walletAddress = await client.importUser({
        linkedAccounts: [
          {
            type: "phone",
            number: phoneNumber,
          },
        ],
        createEthereumWallet: true,
      });

      return c.json({ walletAddress });
    } catch (error) {
      return logError500(c, logger, error, startTime);
    }
  });
  return app;
}
