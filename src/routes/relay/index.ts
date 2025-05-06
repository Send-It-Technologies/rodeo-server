// Server
import { Hono } from "hono";

// Engine utils
import { relay } from "../../utils/engine/relay";
import { waitUntilMined } from "../../utils/engine/wait";

// Validation utils
import { isAddress, isHex } from "thirdweb";
import { logError400, logError500 } from "../../utils/log/error";

// Types
import { zValidator } from "@hono/zod-validator";

import { Env } from "../../utils/common/types";
import { RelayParams, RelayParamsType } from "./types";

export function relayRoutes(): Hono<{ Bindings: Env }> {
  // App
  const app = new Hono<{ Bindings: Env }>();

  app.post("/", zValidator("json", RelayParams), async (c) => {
    // Structured logging setup
    const logger = c.env?.logger || console;
    const startTime = Date.now();

    try {
      // Validate input parameters
      const { to, data } = (await c.req.json()) as RelayParamsType;

      if (!isAddress(to)) {
        logger.warn(`Invalid Ethereum address format: ${to}`);
        return logError400(
          c,
          "VALIDATION_ERROR",
          "Invalid Ethereum address format",
          {
            expectedFormat: "0x followed by 40 hexadecimal characters",
            receivedValue: to,
          }
        );
      }

      if (!isHex(data)) {
        logger.warn(`Invalid transaction format: ${data}`);
        return logError400(
          c,
          "VALIDATION_ERROR",
          "Invalid transaction data format",
          {
            expectedFormat: "0x followed by even hexadecimal characters",
            receivedValue: data,
          }
        );
      }

      try {
        // Send transaction to engine relayer and get queue Id
        const queueId = await relay({
          to,
          data,
          value: "0",
          engineUrl: c.env.ENGINE_INSTANCE_URL,
          engineAccessToken: c.env.ENGINE_AUTH_TOKEN,
          engineWalletAddress: c.env.ENGINE_WALLET_ADDRESS,
        });

        logger.info({
          event: "TRANSACTION_RELAYED",
          queueId,
          to,
          dataLength: data.length,
        });

        try {
          // Wait for transaction to get mined
          const transactionHash = await waitUntilMined({
            polls: 30,
            queueId: queueId,
            engineUrl: c.env.ENGINE_INSTANCE_URL,
            engineAccessToken: c.env.ENGINE_AUTH_TOKEN,
          });

          // Audit logging
          logger.info({
            event: "TRANSACTION_MINED",
            queueId,
            transactionHash,
            to,
            durationMs: Date.now() - startTime,
          });

          return c.json({ 
            transactionHash,
            queueId 
          });
        } catch (miningError) {
          logger.error({
            message: "Error while waiting for transaction to be mined",
            error: miningError instanceof Error ? miningError.stack : String(miningError),
            queueId,
            to,
          });
          
          return logError400(
            c,
            "MINING_ERROR",
            "Failed to mine the transaction",
            {
              queueId,
              to,
              error: miningError instanceof Error ? miningError.message : String(miningError),
            }
          );
        }
      } catch (relayError) {
        logger.error({
          message: "Error relaying transaction",
          error: relayError instanceof Error ? relayError.stack : String(relayError),
          to,
        });
        
        return logError400(
          c,
          "RELAY_ERROR",
          "Failed to relay transaction",
          {
            to,
            error: relayError instanceof Error ? relayError.message : String(relayError),
          }
        );
      }
    } catch (error) {
      // Log the actual error for debugging
      logger.error({
        message: "Error in relay endpoint",
        error: error instanceof Error ? error.stack : String(error),
      });
      
      return logError500(c, logger, error, startTime);
    }
  });

  return app;
}
