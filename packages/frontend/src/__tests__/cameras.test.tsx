import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { Provider } from "urql";
import { AuthProvider } from "../auth/AuthContext";
import { App } from "../App";
import { CameraList } from "../components/CameraList";
import {
  ME,
  CAMERAS,
  ADD_CAMERA_TO_USER,
  REMOVE_CAMERA_FROM_USER,
  ADD_CAMERA,
} from "../graphql/operations";

// Seed data
const camera1 = {
  id: "1",
  name: "Entrance Cam",
  niceName: "Front Door",
  address: "192.168.1.10",
};
const camera2 = {
  id: "2",
  name: "Parking Cam",
  niceName: null,
  address: "192.168.1.11",
};
const camera3 = {
  id: "3",
  name: "Lobby Cam",
  niceName: "Main Lobby",
  address: "192.168.1.12",
};

const meData = {
  me: { id: "u1", username: "alice", cameras: [camera1, camera2] },
};
// camera3 is unassigned (not in user's cameras)
const camerasData = { cameras: [camera1, camera2, camera3] };

const mockAddCamera = vi.fn();
const mockRemoveCamera = vi.fn();
const mockCreateCamera = vi.fn();
const mockLoginMutation = vi.fn();

vi.mock("urql", async (importOriginal) => {
  const actual = await importOriginal<typeof import("urql")>();

  return {
    ...actual,
    useQuery: (args: { query: string }) => {
      if (args.query === ME) {
        return [{ data: meData, fetching: false }];
      }
      if (args.query === CAMERAS) {
        return [{ data: camerasData, fetching: false }];
      }
      return [{ data: undefined, fetching: false }];
    },
    useMutation: (doc: string) => {
      if (doc === ADD_CAMERA_TO_USER) {
        return [{ fetching: false }, mockAddCamera];
      }
      if (doc === REMOVE_CAMERA_FROM_USER) {
        return [{ fetching: false }, mockRemoveCamera];
      }
      if (doc === ADD_CAMERA) {
        return [{ fetching: false }, mockCreateCamera];
      }
      // LOGIN (used by login.test.tsx compatibility)
      return [{ fetching: false, error: undefined }, mockLoginMutation];
    },
  };
});

const stubClient = {
  executeQuery: vi.fn(),
  executeMutation: vi.fn(),
  executeSubscription: vi.fn(),
} as any;

function renderCameraList() {
  return render(
    <FluentProvider theme={webLightTheme}>
      <Provider value={stubClient}>
        <AuthProvider>
          <CameraList />
        </AuthProvider>
      </Provider>
    </FluentProvider>,
  );
}

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
});

describe("CameraList", () => {
  it("shows the logged-in user's cameras", () => {
    renderCameraList();

    expect(screen.getByText("Entrance Cam")).toBeInTheDocument();
    expect(screen.getByText(/Front Door/)).toBeInTheDocument();
    expect(screen.getByText("Parking Cam")).toBeInTheDocument();
    expect(screen.getByText(/192\.168\.1\.10/)).toBeInTheDocument();
    expect(screen.getByText(/192\.168\.1\.11/)).toBeInTheDocument();
  });

  it('clicking "Remove" on a camera calls the remove mutation with the correct cameraId', async () => {
    const user = userEvent.setup();
    mockRemoveCamera.mockResolvedValueOnce({
      data: { removeCameraFromUser: { ...meData.me, cameras: [camera2] } },
    });

    renderCameraList();

    const removeButton = screen.getByRole("button", {
      name: /remove entrance cam/i,
    });
    await user.click(removeButton);

    expect(mockRemoveCamera).toHaveBeenCalledWith({ cameraId: "1" });
  });

  it('selecting an unassigned camera and clicking "Add" calls the add mutation with the correct cameraId', async () => {
    const user = userEvent.setup();
    mockAddCamera.mockResolvedValueOnce({
      data: {
        addCameraToUser: {
          ...meData.me,
          cameras: [camera1, camera2, camera3],
        },
      },
    });

    renderCameraList();

    // camera3 (Lobby Cam / Main Lobby) is unassigned and should appear in the select
    const select = screen.getByRole("combobox", {
      name: /select a camera to add/i,
    });
    await user.selectOptions(select, "3");

    const addButton = screen.getByRole("button", { name: /^add$/i });
    await user.click(addButton);

    expect(mockAddCamera).toHaveBeenCalledWith({ cameraId: "3" });
  });

  it("filling the create-camera form and clicking Create calls addCamera with name, address, and niceName", async () => {
    const user = userEvent.setup();
    const newCamera = {
      id: "99",
      name: "Roof Cam",
      niceName: "Rooftop",
      address: "10.0.0.99",
    };
    mockCreateCamera.mockResolvedValueOnce({
      data: { addCamera: newCamera },
    });

    renderCameraList();

    await user.type(
      screen.getByPlaceholderText(/e\.g\. A8207-VE/i),
      "Roof Cam",
    );
    await user.type(
      screen.getByPlaceholderText(/e\.g\. Front Door/i),
      "Rooftop",
    );
    await user.type(
      screen.getByPlaceholderText(/e\.g\. 192\.168\.1\.10/i),
      "10.0.0.99",
    );

    await user.click(screen.getByRole("button", { name: /^create$/i }));

    expect(mockCreateCamera).toHaveBeenCalledWith({
      name: "Roof Cam",
      niceName: "Rooftop",
      address: "10.0.0.99",
    });
  });

  it('clicking "Logout" transitions back to the login form', async () => {
    const user = userEvent.setup();

    // Seed localStorage so App renders CameraList
    localStorage.setItem("axis.authToken", "test-token");
    renderApp();

    await waitFor(() => {
      expect(screen.getByText(/your cameras/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: /logout/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    });
  });
});
