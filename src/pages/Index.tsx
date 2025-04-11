
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Index = () => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!loading) {
      if (currentUser) {
        switch (currentUser.role) {
          case 'owner':
            navigate('/dashboard');
            break;
          case 'vendor':
            navigate('/vendor/dashboard');
            break;
          case 'repairer':
            navigate('/repairer/dashboard');
            break;
          default:
            navigate('/login');
        }
      } else {
        navigate('/login');
      }
    }
  }, [currentUser, loading, navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
    </div>
  );
};

export default Index;
