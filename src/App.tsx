import { RouterProvider } from 'react-router-dom';
import { createAppRouter } from './lib/router';
import { AuthProvider } from './context/AuthContext';

const router = createAppRouter();

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
