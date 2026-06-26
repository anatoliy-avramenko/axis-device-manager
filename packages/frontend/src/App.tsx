import { useAuth } from "./auth/AuthContext";
import { LoginForm } from "./components/LoginForm";
import { CameraList } from "./components/CameraList";

export function App() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <CameraList /> : <LoginForm />;
}
