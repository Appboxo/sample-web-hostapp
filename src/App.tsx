import "./App.css";
// import { OAuthExample, DirectAuthExample } from "./examples";
import VercelExample from "./examples/vercel-example";

// enum AuthMethod {
//   OAuth = "oauth",
//   Direct = "direct",
//   Vercel = "vercel",
// }
// const AUTH_METHOD: AuthMethod = AuthMethod.Vercel;

function App() {
  return <VercelExample />;
}

export default App;
