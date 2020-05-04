import React from "react";

import OperatorHome from "./OperatorHome";
import UserHome from "./UserHome";
import { Redirect, Route, Switch } from "react-router-dom";

export default function App() {
  return (
    <Switch>
      <Route path="/user" component={UserHome} />
      <Route path="/operator" component={OperatorHome} />
      <Redirect exact from="/" to="/user" />
    </Switch>
  );
}
