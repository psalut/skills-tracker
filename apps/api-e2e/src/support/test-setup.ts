import axios from 'axios';

axios.defaults.baseURL = 'http://localhost:3333';
axios.defaults.validateStatus = () => true;