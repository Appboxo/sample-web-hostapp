import "./App.css";
import { OAuthExample, DirectAuthExample,  LocalStorageTestExample } from "./examples";
import VercelExample from "./examples/vercel-example";

enum ExampleType {
  OAuth = "oauth",
  Direct = "direct",
  Vercel = "vercel",
  Telegram = "telegram",
  LocalStorageTest = "localstorage-test",
}

// Choose example via URL query param or environment variable
// Examples:
//   - http://localhost:3001?example=telegram
//   - http://localhost:3001?example=oauth
//   - Set REACT_APP_EXAMPLE=telegram in .env
function getExampleType(): ExampleType {
  // 1. Check URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const exampleParam = urlParams.get('example');
  
  if (exampleParam && Object.values(ExampleType).includes(exampleParam as ExampleType)) {
    return exampleParam as ExampleType;
  }
  
  // 2. Check environment variable
  const envExample = process.env.REACT_APP_EXAMPLE;
  if (envExample && Object.values(ExampleType).includes(envExample as ExampleType)) {
    return envExample as ExampleType;
  }
  
  // 3. Default to LocalStorageTest example
  return ExampleType.LocalStorageTest;
}

function App() {
  const exampleType = getExampleType();
  
  console.log(`[App] Loading example: ${exampleType}`);
  
  switch (exampleType) {
    case ExampleType.OAuth:
      return <OAuthExample />;
    case ExampleType.Direct:
      return <DirectAuthExample />;
    case ExampleType.Vercel:
      return <VercelExample />;
    case ExampleType.LocalStorageTest:
      return <LocalStorageTestExample />;
    default:
      return <OAuthExample />;
  }
}

export default App;
