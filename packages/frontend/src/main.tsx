import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { Provider as UrqlProvider } from "urql";
import { createUrqlClient } from "./graphql/client";
import { AuthProvider } from "./auth/AuthContext";
import { App } from "./App";

// Root owns the urql client in state so that logout() can replace it,
// flushing urql's document cache (urql v5 has no resetStore() equivalent).
// A new client instance means the next user never sees the previous user's
// cached queries.
function Root() {
  const [urqlClient, setUrqlClient] = useState(createUrqlClient);

  function handleAuthReset() {
    setUrqlClient(createUrqlClient());
  }

  return (
    <UrqlProvider value={urqlClient}>
      <AuthProvider onAuthReset={handleAuthReset}>
        <App />
      </AuthProvider>
    </UrqlProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FluentProvider theme={webLightTheme}>
      <Root />
    </FluentProvider>
  </React.StrictMode>,
);
