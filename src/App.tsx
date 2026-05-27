import { RouterProvider } from 'react-router-dom';
import { createAppRouter } from './lib/router';
import { AuthProvider } from './context/AuthContext';
import { ProgressProvider } from './context/ProgressContext';

const router = createAppRouter();

export default function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <RouterProvider router={router} />
      </ProgressProvider>
    </AuthProvider>
  );
}
