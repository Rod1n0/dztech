import {
  ADD_TO_CART,
  REMOVE_FROM_CART,
  UPDATE_QUANTITY,
  INCREMENT_QUANTITY,
  DECREMENT_QUANTITY,
  CLEAR_CART,
} from './actions';

const loadInitialCart = () => {
  try {
    const savedCart = localStorage.getItem('dztech_cart_state');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch {
    return [];
  }
};

const initialState = {
  cart: loadInitialCart(),
};

export const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADD_TO_CART: {
      const product = action.payload;
      const existingItem = state.cart.find((item) => item.id === product.id);

      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }

      return {
        ...state,
        cart: [...state.cart, { ...product, quantity: 1 }],
      };
    }

    case REMOVE_FROM_CART:
      return {
        ...state,
        cart: state.cart.filter((item) => item.id !== action.payload),
      };

    case UPDATE_QUANTITY: {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        return {
          ...state,
          cart: state.cart.filter((item) => item.id !== productId),
        };
      }
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        ),
      };
    }

    case INCREMENT_QUANTITY:
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.id === action.payload
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };

    case DECREMENT_QUANTITY:
      return {
        ...state,
        cart: state.cart
          .map((item) =>
            item.id === action.payload
              ? { ...item, quantity: item.quantity - 1 }
              : item
          )
          .filter((item) => item.quantity > 0),
      };

    case CLEAR_CART:
      return {
        ...state,
        cart: [],
      };

    default:
      return state;
  }
};

export default cartReducer;