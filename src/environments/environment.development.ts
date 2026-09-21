declare const API_URL: string | undefined;

export const environment = {
  production: false,
  apiUrl: typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:5017/api',
};
