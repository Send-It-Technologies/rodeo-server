// Server
import { Hono } from "hono";

// Logging
import { logError400, logError500 } from "../../utils/log/error";

// Utils
import { getQuote } from "../../utils/swap/quote";

import { base } from "thirdweb/chains";
import {
  createThirdwebClient,
  getContract,
  isAddress,
  readContract,
} from "thirdweb";

// Constants
import { SENDIT_ADDRESS } from "../../utils/common/constants";

// Types
import { zValidator } from "@hono/zod-validator";

import { QuoteQuery } from "./types";
import { Env } from "../../utils/common/types";

export function quoteRoutes(): Hono<{ Bindings: Env }> {
  // App
  const app = new Hono<{ Bindings: Env }>();

  app.get("/", zValidator("query", QuoteQuery), async (c) => {
    // Structured logging setup
    const logger = c.env?.logger || console;
    const startTime = Date.now();

    try {
      // Validate input parameters
      const { spaceAddress, buyTokenAddress, sellTokenAddress, sellAmount } =
        c.req.query();

      if (!isAddress(spaceAddress)) {
        logger.warn(`Invalid Ethereum address format: ${spaceAddress}`);
        return logError400(
          c,
          "VALIDATION_ERROR",
          "Invalid Ethereum address format",
          {
            expectedFormat: "0x followed by 40 hexadecimal characters",
            receivedValue: spaceAddress,
          }
        );
      }

      if (!isAddress(buyTokenAddress)) {
        logger.warn(`Invalid Ethereum address format: ${buyTokenAddress}`);
        return logError400(
          c,
          "VALIDATION_ERROR",
          "Invalid Ethereum address format",
          {
            expectedFormat: "0x followed by 40 hexadecimal characters",
            receivedValue: buyTokenAddress,
          }
        );
      }

      if (!isAddress(sellTokenAddress)) {
        logger.warn(`Invalid Ethereum address format: ${sellTokenAddress}`);
        return logError400(
          c,
          "VALIDATION_ERROR",
          "Invalid Ethereum address format",
          {
            expectedFormat: "0x followed by 40 hexadecimal characters",
            receivedValue: sellTokenAddress,
          }
        );
      }

      try {
        // Get treasury address
        const sendItContract = getContract({
          address: SENDIT_ADDRESS,
          chain: base,
          client: createThirdwebClient({
            secretKey: c.env.THIRDWEB_SECRET_KEY,
          }),
        });

        const treasuryAddress = await readContract({
          contract: sendItContract,
          method: "function getTreasury(address) external view returns (address)",
          params: [spaceAddress],
        });

        if (!treasuryAddress) {
          logger.warn(`Treasury not found for space: ${spaceAddress}`);
          return logError400(
            c,
            "NOT_FOUND",
            "Treasury not found for this space",
            {
              spaceAddress,
              message: "The treasury is required for getting a quote"
            }
          );
        }

        try {
          // Get quote
          const quote = await getQuote({
            buyToken: buyTokenAddress,
            sellToken: sellTokenAddress,
            sellAmount: sellAmount,
            taker: treasuryAddress,
            slippageBps: "500",
            zrxApiKey: c.env.ZRX_API_KEY,
          });

          if (!(quote as any).liquidityAvailable) {
            logger.warn({
              message: "Insufficient liquidity for trade",
              buyToken: buyTokenAddress,
              sellToken: sellTokenAddress,
              sellAmount: sellAmount,
            });
            
            return logError400(
              c,
              "INSUFFICIENT_LIQUIDITY_ERROR",
              "Insufficient liquidity for this trade",
              {
                buyToken: buyTokenAddress,
                sellToken: sellTokenAddress,
                sellAmount: sellAmount,
                buyAmount: (quote as any).buyAmount,
                quoteDetails: quote,
              }
            );
          }

          // Audit logging
          logger.info({
            event: "QUOTE_FETCHED",
            spaceAddress,
            buyToken: buyTokenAddress, 
            sellToken: sellTokenAddress,
            sellAmount: sellAmount,
            buyAmount: (quote as any).buyAmount,
            durationMs: Date.now() - startTime,
          });

          return c.json({ quote });
        } catch (quoteError) {
          logger.error({
            message: "Error fetching quote from exchange",
            error: quoteError instanceof Error ? quoteError.stack : String(quoteError),
            buyToken: buyTokenAddress,
            sellToken: sellTokenAddress,
            sellAmount: sellAmount,
          });
          
          return logError400(
            c,
            "QUOTE_ERROR",
            "Failed to get trading quote from exchange",
            {
              buyToken: buyTokenAddress,
              sellToken: sellTokenAddress,
              sellAmount: sellAmount,
              error: quoteError instanceof Error ? quoteError.message : String(quoteError),
            }
          );
        }
      } catch (contractError) {
        logger.error({
          message: "Error reading from contract",
          error: contractError instanceof Error ? contractError.stack : String(contractError),
          spaceAddress,
        });
        
        return logError500(c, logger, contractError, startTime);
      }
    } catch (error) {
      // Log the actual error for debugging
      logger.error({
        message: "Error in quote endpoint",
        error: error instanceof Error ? error.stack : String(error),
      });
      
      return logError500(c, logger, error, startTime);
    }
  });

  return app;
}
