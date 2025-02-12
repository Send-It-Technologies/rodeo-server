// Core
import { Context } from "hono";

// Logging
import { logError400, logError500 } from "../../utils/log/error";

// Blockchain ops
import { getSpaceMembers } from "../../utils/rodeo/members";

// Utils
import { isAddress } from "thirdweb";

export async function members(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    // Validate input parameters
    const { spaceEthereumAddress } = c.req.query();

    if (!isAddress(spaceEthereumAddress)) {
      logger.warn(`Invalid Ethereum address format: ${spaceEthereumAddress}`);
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Invalid Ethereum address format",
        {
          expectedFormat: "0x followed by 40 hexadecimal characters",
          receivedValue: spaceEthereumAddress,
        }
      );
    }

    // Blockchain read
    const members = await getSpaceMembers({
      spaceAddress: spaceEthereumAddress,
      thirdwebSecretKey: c.env.THIRDWEB_SECRET_KEY,
    });

    // Audit logging
    logger.info({
      event: "MEMBERS_FETCHED",
      spaceEthereumAddress,
      durationMs: Date.now() - startTime,
    });

    return c.json({ members });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
