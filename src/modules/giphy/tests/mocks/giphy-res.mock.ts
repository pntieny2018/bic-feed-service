import { AxiosResponse } from 'axios';

export const giphyResMock: AxiosResponse = {
  data: {
    data: [
      {
        id: 'sWWA3e9CUs33ujxMkX',
        images: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          preview_webp: {
            type: 'gif',
            url: 'https://giphy.com/gifs/xbox-game-xbox-series-x-s-sWWA3e9CUs33ujxMkX',
            height: '200',
            width: '355',
            size: '14195',
          },
        },
      },
    ],
  },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
};
