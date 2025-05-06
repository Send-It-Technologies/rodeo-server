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
    const logger = console;
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
        logger.warn(
          `Insufficient liquidity for buying ${buyTokenAddress} in exchange for ${sellAmount} of ${sellTokenAddress}`
        );
        return logError400(
          c,
          "OUTPUT_ERROR",
          "Insufficient liquidity for trade",
          {
            quote,
          }
        );
      }

      return c.json({ quote });
    } catch (error) {
      return logError500(c, logger, error, startTime);
    }
  });

  return app;
}
