import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext.jsx';
import Button from './Button';

function LogoutButton() {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="absolute top-4 right-4 flex items-center space-x-4">
        <span className="text-sm text-gray-600">{currentUser.email}</span>
        <Button onClick={handleLogout}>
            Logout
        </Button>
    </div>
  );
}

export default LogoutButton;