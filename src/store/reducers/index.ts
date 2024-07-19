import { combineReducers } from "@reduxjs/toolkit";
import configuration, { name as confSliceName } from "./configuration";
import { feedApi } from "./feed";

const rootReducer = combineReducers({
  [confSliceName]: configuration,
  [feedApi.reducerPath]: feedApi.reducer,
});

export default rootReducer;
