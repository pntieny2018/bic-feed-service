export enum GiphyType {
  GIF_FULL = 'gif_full',
  GIF_PREVIEW = 'gif_preview',
}

export function createUrlFromId(id?: string, type: GiphyType = GiphyType.GIF_FULL): string {
  if (!id) return null;
  if (type === GiphyType.GIF_FULL) {
    return 'https://i.giphy.com/' + id + '.gif';
  } else if (type === GiphyType.GIF_PREVIEW) {
    return 'https://i.giphy.com/media/' + id + '/giphy.webp';
  }
}

export function getGiphyDetailInfo(
  id?: string,
  type: GiphyType = GiphyType.GIF_FULL,
  images?: object
): { url: string; height: string; width: string; size: string } {
  if (!id) return null;
  if (type === GiphyType.GIF_FULL) {
    return {
      url: 'https://i.giphy.com/' + id + '.gif',
      height: images['original'] ? images['original'].height : null,
      width: images['original'] ? images['original'].width : null,
      size: images['original'] ? images['original'].size : null,
    };
  } else if (type === GiphyType.GIF_PREVIEW) {
    return {
      url: 'https://i.giphy.com/media/' + id + '/giphy.webp',
      height: images['preview_webp'] ? images['preview_webp'].height : null,
      width: images['preview_webp'] ? images['preview_webp'].width : null,
      size: images['preview_webp'] ? images['preview_webp'].size : null,
    };
  }
}
