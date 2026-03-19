import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

const target =
  process.env.API_PROXY_TARGET ??
  `http://${process.env.API_HOST ?? process.env.HOST ?? '127.0.0.1'}:${process.env.API_PORT ?? process.env.PORT ?? '3000'}`;

export default {
  '/api': {
    target,
    changeOrigin: true,
    secure: false,
    pathRewrite: {
      '^/api': '',
    },
    logLevel: 'warn',
  },
};
