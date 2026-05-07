import { css } from "@emotion/react";
import React from 'react';
import { Redirect, Route } from 'react-router-dom';
import GridLoader from "react-spinners/GridLoader";
import useAuth from '../hooks/useAuth';

const override = css`
  display: block;
  margin: 0 auto;
  border-color: red;
`;

const AdminRoute = ({ children, ...rest }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <GridLoader color="#1d4ed8" css={override} size={25} />
      </div>
    );
  }

  return (
    <Route
      {...rest}
      render={({ location }) => {
        if (!user?.email) {
          return (
            <Redirect
              to={{
                pathname: "/signin",
                state: { from: location },
              }}
            />
          );
        }

        if (user?.role !== 'ADMIN') {
          return (
            <Redirect
              to={{
                pathname: "/",
              }}
            />
          );
        }

        return children;
      }}
    />
  );
};

export default AdminRoute;

