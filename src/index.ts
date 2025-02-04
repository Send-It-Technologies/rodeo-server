// Server
import { Hono } from "hono";

// Engine utils
import { relay } from "./engine/relay";
import { waitUntilMined } from "./engine/wait";

// Validation utils
import { isAddress, isHex } from "thirdweb";
import { logError400, logError500 } from "./log/error";

// Types
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

// Type definitions
const RelayParams = z.object({
  to: z.string().startsWith("0x"),
  data: z.string().startsWith("0x"),
});

type RelayParamsType = z.infer<typeof RelayParams>;

type Env = {
  DATABASE_URL: string;
  ENGINE_INSTANCE_URL: string;
  ENGINE_AUTH_TOKEN: string;
  ENGINE_WALLET_ADDRESS: string;
};

// App
const app = new Hono<{ Bindings: Env }>();

app.post("/relay", zValidator("json", RelayParams), async (c) => {
  // Structured logging setup. TODO: Add proper logging later.
  const logger = console;
  const startTime = Date.now();

  try {
    // Validate input parameters
    const { to, data } = (await c.req.json()) as RelayParamsType;

    if (!to) {
      logger.warn("Missing to address parameter");
      return logError400(
        c,
        "VALIDATION_ERROR",
        "To address is required as a query parameter"
      );
    }

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
    const queueId = await relay({
      to,
      data,
      value: "0",
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

export default app;
