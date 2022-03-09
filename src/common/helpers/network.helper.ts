import { NetworkInterfaceInfo, networkInterfaces } from 'os';

export class NetworkHelper {
  /**
   * Returns an array of `NetworkInterfaceInfo`s for all host interfaces that
   * have IPv4 addresses from the private address space,
   * including the loopback address space (127.x.x.x).
   */
  public static getPrivateIPNInfos = (): (
    | NetworkInterfaceInfo
    | undefined
  )[] => {
    return Object.values(networkInterfaces())
      .flatMap((infos) => {
        return infos?.filter((i) => i.family === 'IPv4');
      })
      .filter((info) => {
        return (
          info?.address.match(
            /(^127\.)|(^10\.)|(^172\.1[6-9]\.)|(^172\.2\d\.)|(^172\.3[0-1]\.)|(^192\.168\.)/
          ) !== null
        );
      });
  };

  /**
   * Returns an array of IPv4 addresses for all host interfaces that
   * have IPv4 addresses from the private address space,
   * including the loopback address space (127.x.x.x).
   */
  public static getPrivateIPs = (): (string | undefined)[] => {
    return this.getPrivateIPNInfos().map((i) => i?.address);
  };

  /**
   * Returns an array of `NetworkInterfaceInfo`s for all host interfaces that
   * have IPv4 addresses from the external private address space,
   * ie. except the loopback (internal) address space (127.x.x.x).
   */
  public static getPrivateExternalIPNInfos = (): (
    | NetworkInterfaceInfo
    | undefined
  )[] => {
    return Object.values(networkInterfaces())
      .flatMap((infos) => {
        return infos?.filter((i) => !i.internal && i.family === 'IPv4');
      })
      .filter((info) => {
        return (
          info?.address.match(
            /(^10\.)|(^172\.1[6-9]\.)|(^172\.2\d\.)|(^172\.3[0-1]\.)|(^192\.168\.)/
          ) !== null
        );
      });
  };

  /**
   * Returns an array of IPv4 addresses for all host interfaces that
   * have IPv4 addresses from the external private address space,
   * ie. except the loopback (internal) address space (127.x.x.x).
   */
  public static getPrivateExternalIPs = (): (string | undefined)[] => {
    return this.getPrivateExternalIPNInfos().map((i) => i?.address);
  };
}
