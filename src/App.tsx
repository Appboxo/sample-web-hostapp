import "./App.css";
import { OAuthExample, DirectAuthExample,  TelegramWebViewExample } from "./examples";
import VercelExample from "./examples/vercel-example";

enum ExampleType {
  OAuth = "oauth",
  Direct = "direct",
  Vercel = "vercel",
  TelegramWebView = "telegram-webview",
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
  
  // 3. Default to Telegram WebView example
  return ExampleType.TelegramWebView;
}

function App() {
  const exampleType = getExampleType();
  
  switch (exampleType) {
    case ExampleType.OAuth:
      return <OAuthExample />;
    case ExampleType.Direct:
      return <DirectAuthExample />;
    case ExampleType.Vercel:
      return <VercelExample />;
    case ExampleType.TelegramWebView:
      return <TelegramWebViewExample />;
    default:
      return <OAuthExample />;
  }
}

export default App;
