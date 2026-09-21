declare const API_URL: string | undefined;

export const environment = {
  production: true,
  apiUrl: typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:5000/api',
};
