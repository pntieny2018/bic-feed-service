export enum GifType {
  ORIGINAL = 'original',
  PREVIEW_GIF = 'preview_gif',
  PREVIEW_WEBP = 'preview_webp',
}

export function createUrlFromId(id?: string, type: GifType = GifType.ORIGINAL): string {
  if (!id) return null;
  if (type === GifType.ORIGINAL) {
    return 'https://i.giphy.com/' + id + '.gif';
  } else if (type === GifType.PREVIEW_GIF) {
    return 'https://i.giphy.com/media/' + id + '/giphy.webp';
  }
}

export function getGiphyDetailInfo(
  id?: string,
  type: GifType = GifType.PREVIEW_WEBP,
  images?: object
): { url: string; height: string; width: string; size: string } {
  if (!id) return null;
  if (type === GifType.ORIGINAL) {
    return {
      url: 'https://i.giphy.com/' + id + '.gif',
      height: images['original'] ? images['original'].height : null,
      width: images['original'] ? images['original'].width : null,
      size: images['original'] ? images['original'].size : null,
    };
  } else if (type === GifType.PREVIEW_GIF) {
    return {
      url: 'https://i.giphy.com/media/' + id + '/giphy.gif',
      height: images['preview_gif'] ? images['preview_gif'].height : null,
      width: images['preview_gif'] ? images['preview_gif'].width : null,
      size: images['preview_gif'] ? images['preview_gif'].size : null,
    };
  } else if (type === GifType.PREVIEW_WEBP) {
    return {
      url: 'https://i.giphy.com/media/' + id + '/giphy.webp',
      height: images['preview_webp'] ? images['preview_webp'].height : null,
      width: images['preview_webp'] ? images['preview_webp'].width : null,
      size: images['preview_webp'] ? images['preview_webp'].size : null,
    };
  }
}
