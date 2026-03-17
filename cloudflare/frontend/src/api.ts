import axios from 'axios';

const api = axios.create({
  timeout: 200000,
  headers: {
    'x-user-did': 'did:abt:default-uploader',
  },
});

export default api;

export function getImageUrl(filename: string): string {
  return `/uploads/${filename}`;
}
