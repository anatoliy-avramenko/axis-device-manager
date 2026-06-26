import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { Provider } from "urql";
import { AuthProvider } from "../auth/AuthContext";
import { App } from "../App";

// Track the mutation state so we can simulate urql's reactive state updates.
let mutationState: { fetching: boolean; error: unknown } = {
  fetching: false,
  error: undefined,
};
const mockLoginMutation = vi.fn();

vi.mock("urql", async (importOriginal) => {
  const actual = await importOriginal<typeof import("urql")>();
  return {
    ...actual,
    useMutation: () => [mutationState, mockLoginMutation],
    useQuery: () => [{ data: undefined, fetching: false }],
  };
});

// Minimal stub client — never used for real requests in tests.
const stubClient = {
  executeQuery: vi.fn(),
  executeMutation: vi.fn(),
  executeSubscription: vi.fn(),
} as any;

function renderApp() {
  return render(
    <FluentProvider theme={webLightTheme}>
      <Provider value={stubClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </Provider>
    </FluentProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mutationState = { fetching: false, error: undefined };
});

describe("Login flow", () => {
  it("shows the login form when unauthenticated", () => {
    renderApp();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("submits credentials and transitions to the authed view on success", async () => {
    const user = userEvent.setup();
    mockLoginMutation.mockResolvedValueOnce({
      data: {
        login: {
          token: "test-token",
          user: { id: "1", username: "alice", cameras: [] },
        },
      },
    });

    renderApp();
    await user.type(screen.getByLabelText(/username/i), "alice");
    await user.type(screen.getByLabelText(/password/i), "password");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/your cameras/i)).toBeInTheDocument();
    });
  });

  it("shows an error message on failed login", async () => {
    const user = userEvent.setup();
    // When login fails, urql sets loginResult.error on the state.
    // Simulate this by having executeLogin mutate the shared state and
    // return that error so the component's handleSubmit also sees it.
    mockLoginMutation.mockImplementationOnce(async () => {
      const err = {
        graphQLErrors: [{ message: "Invalid credentials" }],
        message: "Invalid credentials",
      };
      mutationState = { fetching: false, error: err };
      return { error: err };
    });

    const { rerender } = renderApp();
    await user.type(screen.getByLabelText(/username/i), "alice");
    await user.type(screen.getByLabelText(/password/i), "wrong");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    // Force a re-render so React picks up the mutated mutationState.
    rerender(
      <FluentProvider theme={webLightTheme}>
        <Provider value={stubClient}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </Provider>
      </FluentProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(screen.getByRole("alert")).toHaveTextContent(/invalid credentials/i);
  });

  it("shows the authed view immediately when a token exists in localStorage", () => {
    localStorage.setItem("axis.authToken", "existing-token");
    renderApp();
    expect(screen.getByText(/your cameras/i)).toBeInTheDocument();
  });

  it("shows the login form when localStorage contains an empty string token", () => {
    // An empty string must NOT count as authenticated; otherwise the user is
    // stuck on CameraList with no way to reach the login form.
    localStorage.setItem("axis.authToken", "");
    renderApp();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  });

  it("returns to the login form after logout", async () => {
    localStorage.setItem("axis.authToken", "existing-token");
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: /logout/i }));
    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });
  });
});
