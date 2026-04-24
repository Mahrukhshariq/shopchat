import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children, role }) => {
  const { currentUser, dbUser } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;
  if (role && dbUser?.role !== role) return <Navigate to="/" replace />;

  return children;
};

export default PrivateRoute;
