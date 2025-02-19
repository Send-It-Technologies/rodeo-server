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
import {
  RelayChainParams,
  RelayParams,
  RelayParamsType,
  RelayChainParamsType,
} from "./types";
import { base } from "thirdweb/chains";

export function relayRoutes(): Hono<{ Bindings: Env }> {
  // App
  const app = new Hono<{ Bindings: Env }>();

  app.post("/", zValidator("json", RelayParams), async (c) => {
    // Structured logging setup. TODO: Add proper logging later.
    const logger = console;
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

      // Send transaction to engine relayer and get queue Id
      console.log("BASE chainId: ", base.id.toString());
      const queueId = await relay({
        to,
        data,
        value: "0",
        chainId: base.id.toString(),
        engineUrl: c.env.ENGINE_INSTANCE_URL,
        engineAccessToken: c.env.ENGINE_AUTH_TOKEN,
        engineWalletAddress: c.env.ENGINE_WALLET_ADDRESS,
      });

      // Wait for transaction to get mined
      const transactionHash = await waitUntilMined({
        polls: 10,
        queueId: queueId,
        engineUrl: c.env.ENGINE_INSTANCE_URL,
        engineAccessToken: c.env.ENGINE_AUTH_TOKEN,
      });

      return c.json({ transactionHash });
    } catch (error) {
      return logError500(c, logger, error, startTime);
    }
  });

  app.post("/chain", zValidator("json", RelayChainParams), async (c) => {
    // Structured logging setup. TODO: Add proper logging later.
    const logger = console;
    const startTime = Date.now();

    try {
      // Validate input parameters
      const { to, data, chainId } =
        (await c.req.json()) as RelayChainParamsType;

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

      // Send transaction to engine relayer and get queue Id
      console.log("Params chainId: ", chainId);
      const queueId = await relay({
        to,
        data,
        value: "0",
        chainId,
        engineUrl: c.env.ENGINE_INSTANCE_URL,
        engineAccessToken: c.env.ENGINE_AUTH_TOKEN,
        engineWalletAddress: c.env.ENGINE_WALLET_ADDRESS,
      });

      // Wait for transaction to get mined
      const transactionHash = await waitUntilMined({
        polls: 10,
        queueId: queueId,
        engineUrl: c.env.ENGINE_INSTANCE_URL,
        engineAccessToken: c.env.ENGINE_AUTH_TOKEN,
      });

      return c.json({ transactionHash });
    } catch (error) {
      return logError500(c, logger, error, startTime);
    }
  });

  return app;
}
