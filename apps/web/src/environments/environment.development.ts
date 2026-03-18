import type { Environment } from './environment.model';
import { getRuntimeApiBaseUrl } from '../app/core/config/runtime-config';

export const environment: Environment = {
  production: false,
  apiBaseUrl: getRuntimeApiBaseUrl(),
};
