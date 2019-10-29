/* eslint-disable consistent-return */
import axios from 'axios';

const ApiService = {
  init(baseURL, store, router) {
    const currentToken = localStorage.getItem('token');
    if (currentToken == null) {
      this.redirectToLogin(store, router);
    }
    axios.defaults.headers.common.Authorization = `Bearer ${currentToken}`;
    axios.defaults.baseURL = baseURL;
  },
  setLanguage(language) {
    axios.defaults.headers.common['Accept-Language'] = language;
  },

  redirectToLogin(store, router) {
    localStorage.removeItem('token');
    // eslint-disable-next-line no-case-declarations
    router.replace('/login');
    store.commit('openSnackbar', { type: 'error', text: 'Please login to continue' });
  },


};

export default ApiService;
