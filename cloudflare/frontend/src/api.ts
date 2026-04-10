import axios from 'axios';

const api = axios.create({
  timeout: 200000,
  withCredentials: true, // send login_token cookie
});

export default api;

export function getImageUrl(filename: string): string {
  return `/uploads/${filename}`;
}
