// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { createGroup } from "../../db/api/groups";

// Blockchain ops
import { relay } from "../../utils/engine/relay";
import { waitUntilMined } from "../../utils/engine/wait";
import { getTransactionReceipt } from "../../utils/engine/receipt";
import { decodeRegisterResult } from "../../utils/rodeo/decodeRegisterResult";

// Logging
import { logError500 } from "../../utils/log/error";

// Types
import { GroupCreateParamsType } from "./types";
import { getCreateAndRegisterTx } from "../../utils/rodeo/register";

export async function create(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Get input parameters
    const {
      name,
      symbol,
      description,
      adminEthereumAddress,
    }: GroupCreateParamsType = await c.req.json();

    // Build transaction to register a space.
    const registerTx = await getCreateAndRegisterTx({
      name,
      symbol,
      description,
      adminEthereumAddress,
      thirdwebSecretKey: c.env.THIRDWEB_SECRET_KEY,
    });

    // Send transaction to engine relayer and get queue Id
    const queueId = await relay({
      to: registerTx.to as string,
      data: registerTx.data as string,
      value: (registerTx.value as BigInt).toString(),
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

    logger.info({
      event: "SPACE_REGISTERED",
      transactionHash,
      durationMs: Date.now() - startTime,
    });

    // Get receipt
    const receipt = await getTransactionReceipt({
      transactionHash,
      engineUrl: c.env.ENGINE_INSTANCE_URL,
      engineAccessToken: c.env.ENGINE_AUTH_TOKEN,
    });

    // Decode transaction hash and get addresses.
    const { space, treasury, inviteToken, sharesToken } =
      decodeRegisterResult(receipt);

    // DB Ops
    const group = await createGroup(db, {
      name,
      description,
      spaceContractAddress: space,
      sharesContractAddress: sharesToken,
      inviteContractAddress: inviteToken,
      treasuryContractAddress: treasury,
    });

    return c.json({ group });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
