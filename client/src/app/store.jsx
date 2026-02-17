import { createContext, useContext, useReducer } from "react";

const initialState = {
  filters: {
    category: "",
    severity: "",
    status: "",
    ward: "",
    district: "",
  },
  notifications: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_FILTER":
      return {
        ...state,
        filters: { ...state.filters, [action.key]: action.value },
      };
    case "RESET_FILTERS":
      return { ...state, filters: initialState.filters };
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => n.id !== action.id
        ),
      };
    default:
      return state;
  }
};

const StoreContext = createContext(null);

export const StoreProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};
