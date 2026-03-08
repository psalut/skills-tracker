import axios from 'axios';
import dotenv from 'dotenv';
import path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const ENV_PATH = path.join(REPO_ROOT, '.env.test');

dotenv.config({ path: ENV_PATH });

axios.defaults.baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3333';
axios.defaults.validateStatus = () => true;
