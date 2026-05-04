import { AppRouter } from './app/router';
import { AuthProvider } from './app/store/auth-store';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
