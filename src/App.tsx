import "./App.css";
import { OAuthExample, DirectAuthExample } from "./examples";

enum AuthMethod {
  OAuth = "oauth",
  Direct = "direct",
}
const AUTH_METHOD: AuthMethod = AuthMethod.Direct;

function App() {
  return AUTH_METHOD === AuthMethod.OAuth ? <OAuthExample /> : <DirectAuthExample />;
}

export default App;
