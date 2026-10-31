import { createStore } from 'redux';
import { cartReducer } from './reducer';

export const store = createStore(
  cartReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

store.subscribe(() => {
  try {
    const state = store.getState();
    localStorage.setItem('dztech_cart_state', JSON.stringify(state.cart));
  } catch {
    // Ignore storage write errors in restricted browsing modes
  }
});

export default store;