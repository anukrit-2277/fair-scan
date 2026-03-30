import { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import store from './app/store';
import router from './app/router';
import { fetchCurrentUser, finishInitializing } from './features/auth/authSlice';

const AuthInitializer = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = localStorage.getItem('fs_token');
    if (token) {
      dispatch(fetchCurrentUser());
    } else {
      dispatch(finishInitializing());
    }
  }, [dispatch]);

  return children;
};

const App = () => {
  return (
    <Provider store={store}>
      <AuthInitializer>
        <RouterProvider router={router} />
      </AuthInitializer>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-bg-elevated)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-default)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            boxShadow: 'var(--shadow-lg)',
          },
          success: {
            iconTheme: { primary: '#00D68F', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#FF6B6B', secondary: '#fff' },
          },
        }}
      />
    </Provider>
  );
};

export default App;
