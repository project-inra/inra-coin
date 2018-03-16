// @flow

// Compatible with IPv4/IPv6
const ADDR_REGEX = /^\[?([^\]]+)\]?:(\d+)$/;

/**
 * Parses an IPv4/IPv6 address. Returns `host` and `port`.
 *
 * @param   {string}  addr    IPv4 or IPv6 address
 * @return  {Object}
 */
export function parseAddress(addr: string): Object {
  const match = ADDR_REGEX.exec(addr);

  if (!match) {
    throw new Error(`Invalid address ${addr}`);
  }

  return {
    host: String(match[1]),
    port: Number(match[2])
  };
}
