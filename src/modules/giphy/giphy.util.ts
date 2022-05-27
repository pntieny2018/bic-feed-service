export enum GiphyType {
  GIF_FULL = 'gif_full',
  GIF_PREVIEW = 'gif_preview',
}

export function createUrlFromId(id?: string, type: GiphyType = GiphyType.GIF_FULL): string {
  if (!id) return null;
  if (type === GiphyType.GIF_FULL) {
    return 'https://i.giphy.com/' + id + '.gif';
  } else if (type === GiphyType.GIF_PREVIEW) {
    return 'https://i.giphy.com/media/' + id + '/giphy-preview.gif';
  }
}
