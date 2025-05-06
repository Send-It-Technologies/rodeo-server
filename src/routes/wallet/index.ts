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
import { isValidE164 } from "../../utils/common/isValidE164";

export function walletRoutes(): Hono<{ Bindings: Env }> {
  // App
  const app = new Hono<{ Bindings: Env }>();

  app.get("/phone", zValidator("query", WalletPhoneQuery), async (c) => {
    // Structured logging setup
    const logger = c.env?.logger || console;
    const startTime = Date.now();

    try {
      // Validate input parameters
      const { phoneNumber } = c.req.query() as WalletPhoneQueryType;

      if (!isValidE164(phoneNumber)) {
        logger.warn(`Invalid E164 phone number format: ${phoneNumber}`);
        return logError400(
          c,
          "VALIDATION_ERROR",
          "Invalid E164 phone number format",
          {
            expectedFormat: "E164 phone number format (e.g., +14155552671)",
            receivedValue: phoneNumber,
          }
        );
      }

      try {
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

        if (!walletAddress) {
          logger.warn(`Failed to retrieve wallet for phone number: ${phoneNumber}`);
          return logError400(
            c,
            "WALLET_ERROR",
            "Failed to retrieve or create wallet for this phone number",
            {
              phoneNumber: phoneNumber.substring(0, 6) + "******", // Mask part of phone number for privacy in logs
            }
          );
        }

        // Audit logging
        logger.info({
          event: "WALLET_FETCHED",
          phoneHash: phoneNumber.substring(0, 4) + "..." + phoneNumber.substring(phoneNumber.length - 4),
          durationMs: Date.now() - startTime,
        });

        return c.json({ walletAddress });
      } catch (privyError) {
        logger.error({
          message: "Error with Privy wallet service",
          error: privyError instanceof Error ? privyError.stack : String(privyError),
          phoneHash: phoneNumber.substring(0, 4) + "..." + phoneNumber.substring(phoneNumber.length - 4),
        });
        
        return logError400(
          c,
          "WALLET_SERVICE_ERROR",
          "Failed to create or retrieve wallet",
          {
            error: privyError instanceof Error ? privyError.message : String(privyError),
          }
        );
      }
    } catch (error) {
      // Log the actual error for debugging
      logger.error({
        message: "Error in wallet/phone endpoint",
        error: error instanceof Error ? error.stack : String(error),
      });
      
      return logError500(c, logger, error, startTime);
    }
  });
  return app;
}
