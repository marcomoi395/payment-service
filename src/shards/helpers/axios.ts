import _axios from 'axios';

const axios = _axios.create({
  timeout: 60000,
});

axios.interceptors.request.use((config) => {
  if (!config.signal) config.signal = AbortSignal.timeout(60000);
  return config;
});

export { axios };
