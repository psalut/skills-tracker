import axios from 'axios';
import {
  getE2EBaseUrl,
  loadWorkspaceEnv,
} from '../../../../tools/env/workspace-env';

loadWorkspaceEnv({ environment: 'test' });

axios.defaults.baseURL = getE2EBaseUrl();
axios.defaults.validateStatus = () => true;
