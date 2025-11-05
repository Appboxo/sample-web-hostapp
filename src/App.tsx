import { useState } from "react";
import "./App.css";
import { OAuthExample, DirectAuthExample } from "./examples";

enum AuthMethod {
  OAuth = "oauth",
  Direct = "direct",
}

function App() {
  const [onPage, setOnPage] = useState(true);

  const trigger = () => {
    setOnPage((prev) => {
      return !prev;
    });
  };

  return (
    <>
      <button onClick={trigger}>Trigger</button>
      {onPage ? (
        <OAuthExample />
      ) : (
        <DirectAuthExample />
      )}
    </>
  );
}

export default App;
