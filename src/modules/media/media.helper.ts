import sizeOf from 'image-size';

export class MediaHelper {
  public static async getDimensions(buffer: Buffer): Promise<{
    width: number;
    height: number;
  }> {
    try {
      return sizeOf(buffer);
    } catch (e) {
      return {
        width: 0,
        height: 0,
      };
    }
  }
}
