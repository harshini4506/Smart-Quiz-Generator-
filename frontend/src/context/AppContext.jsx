import React, { createContext, useContext, useMemo, useReducer } from "react";

const AppContext = createContext(null);

const initialState = {
  selectedDocId: localStorage.getItem("selected_doc_id") || "",
  resultData: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case "SET_SELECTED_DOC":
      const newDocId = action.payload || "";
      localStorage.setItem("selected_doc_id", newDocId);
      return { ...state, selectedDocId: newDocId };
    case "SET_RESULT_DATA":
      return { ...state, resultData: action.payload || null };
    case "CLEAR_RESULT_DATA":
      return { ...state, resultData: null };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used inside AppProvider");
  }
  return ctx;
}
