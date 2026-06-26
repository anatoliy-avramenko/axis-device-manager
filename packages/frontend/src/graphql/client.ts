import { createClient, cacheExchange, fetchExchange } from "urql";
import { getStoredToken } from "../auth/AuthContext";

const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";

// fetchOptions MUST be a function so it reads the current token on each
// request. A token captured once at creation would be stale after login.
//
// We export a factory rather than a bare singleton so that logout() can
// recreate the client, which flushes urql's document cache (urql v5 has no
// resetStore() equivalent). See main.tsx Root component.
export function createUrqlClient() {
  return createClient({
    url: GRAPHQL_ENDPOINT,
    exchanges: [cacheExchange, fetchExchange],
    fetchOptions: () => {
      const token = getStoredToken();
      return {
        headers: {
          authorization: token ? `Bearer ${token}` : "",
        },
      };
    },
  });
}
