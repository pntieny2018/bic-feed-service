export interface IAxiosConfig {
  group: {
    baseUrl: string;
    maxRedirects: number;
    timeout: number;
  };
  upload: {
    baseUrl: string;
    maxRedirects: number;
    timeout: number;
  };
}
