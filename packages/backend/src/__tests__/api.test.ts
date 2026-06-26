import { describe, it, expect } from "vitest";
import { yoga } from "../yoga.js";

type GraphQLResult = { data?: any; errors?: { message: string }[] };

/** Drive the real yoga app over HTTP, optionally carrying a bearer token. */
async function run(
  query: string,
  variables?: Record<string, unknown>,
  token?: string,
): Promise<GraphQLResult> {
  const response = await yoga.fetch("http://yoga/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });
  return (await response.json()) as GraphQLResult;
}

const LOGIN = `
    mutation Login($username: String!, $password: String!) {
        login(username: $username, password: $password) {
            token
            user { id username cameras { id name } }
        }
    }
`;

const ME = `
    query Me {
        me { id username cameras { id name } }
    }
`;

const ADD_CAMERA = `
    mutation Add($cameraId: ID!) {
        addCameraToUser(cameraId: $cameraId) {
            cameras { id name }
        }
    }
`;

const CREATE_CAMERA = `
    mutation Create($name: String!, $address: String!, $niceName: String) {
        addCamera(name: $name, address: $address, niceName: $niceName) {
            id name address niceName
        }
    }
`;

const REMOVE_CAMERA = `
    mutation Remove($cameraId: ID!) {
        removeCameraFromUser(cameraId: $cameraId) {
            cameras { id name }
        }
    }
`;

describe("GraphQL API", () => {
  it("(1) login with valid credentials returns a token and user", async () => {
    const result = await run(LOGIN, {
      username: "alice",
      password: "password",
    });
    expect(result.errors).toBeUndefined();
    const { token, user } = result.data.login as {
      token: string;
      user: { username: string };
    };
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
    expect(user.username).toBe("alice");
  });

  it("(2) login with wrong password returns an error", async () => {
    const result = await run(LOGIN, { username: "alice", password: "wrong" });
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toMatch(/Invalid credentials/);
  });

  it("(3) me with a valid token returns the user and their cameras", async () => {
    const loginResult = await run(LOGIN, {
      username: "alice",
      password: "password",
    });
    const { token } = loginResult.data.login as { token: string };

    const meResult = await run(ME, undefined, token);
    expect(meResult.errors).toBeUndefined();
    const me = meResult.data.me as {
      username: string;
      cameras: { id: string }[];
    };
    expect(me.username).toBe("alice");
    expect(me.cameras.some((c) => c.id === "0")).toBe(true);
  });

  it("(4) me without a token returns null", async () => {
    const result = await run(ME);
    expect(result.errors).toBeUndefined();
    expect(result.data.me).toBeNull();
  });

  it("(5) addCameraToUser (authed) adds a camera so me.cameras grows", async () => {
    // Log in as bob (owns camera '1'); add camera '0'
    const loginResult = await run(LOGIN, {
      username: "bob",
      password: "password",
    });
    const { token } = loginResult.data.login as { token: string };

    const before = await run(ME, undefined, token);
    const beforeCount = (before.data.me as { cameras: unknown[] }).cameras
      .length;

    const addResult = await run(ADD_CAMERA, { cameraId: "0" }, token);
    expect(addResult.errors).toBeUndefined();
    const afterCameras = (
      addResult.data.addCameraToUser as { cameras: { id: string }[] }
    ).cameras;
    expect(afterCameras.length).toBe(beforeCount + 1);
    expect(afterCameras.some((c) => c.id === "0")).toBe(true);
  });

  it("(6) removeCameraFromUser (authed) removes a camera so me.cameras shrinks", async () => {
    // bob now owns both cameras (from test 5); remove camera '0'
    const loginResult = await run(LOGIN, {
      username: "bob",
      password: "password",
    });
    const { token } = loginResult.data.login as { token: string };

    const before = await run(ME, undefined, token);
    const beforeCount = (before.data.me as { cameras: unknown[] }).cameras
      .length;

    const removeResult = await run(REMOVE_CAMERA, { cameraId: "0" }, token);
    expect(removeResult.errors).toBeUndefined();
    const afterCameras = (
      removeResult.data.removeCameraFromUser as { cameras: { id: string }[] }
    ).cameras;
    expect(afterCameras.length).toBe(beforeCount - 1);
    expect(afterCameras.some((c) => c.id === "0")).toBe(false);
  });

  it("(7) addCameraToUser without a token returns a Not authenticated error", async () => {
    const result = await run(ADD_CAMERA, { cameraId: "0" });
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toMatch(/Not authenticated/);
  });

  it("(8) addCameraToUser with a non-existent cameraId returns an error", async () => {
    const loginResult = await run(LOGIN, {
      username: "alice",
      password: "password",
    });
    const { token } = loginResult.data.login as { token: string };

    const result = await run(ADD_CAMERA, { cameraId: "nonexistent" }, token);
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toMatch(/does not exist/);
  });

  it("(9) addCamera without a token returns Not authenticated", async () => {
    const result = await run(CREATE_CAMERA, {
      name: "Test Cam",
      address: "10.0.0.1",
    });
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toMatch(/Not authenticated/);
  });

  it("(10) addCamera with a valid token creates a camera and returns it", async () => {
    const loginResult = await run(LOGIN, {
      username: "alice",
      password: "password",
    });
    const { token } = loginResult.data.login as { token: string };

    const result = await run(
      CREATE_CAMERA,
      { name: "Roof Cam", address: "10.0.0.99", niceName: "Rooftop" },
      token,
    );
    expect(result.errors).toBeUndefined();
    const cam = result.data.addCamera as {
      id: string;
      name: string;
      address: string;
      niceName: string;
    };
    expect(cam.name).toBe("Roof Cam");
    expect(cam.address).toBe("10.0.0.99");
    expect(cam.niceName).toBe("Rooftop");
  });

  it("(11) removeCameraFromUser for a camera the user does not own returns an error", async () => {
    // alice owns camera '0'; camera '1' belongs to bob
    const loginResult = await run(LOGIN, {
      username: "alice",
      password: "password",
    });
    const { token } = loginResult.data.login as { token: string };

    const result = await run(REMOVE_CAMERA, { cameraId: "1" }, token);
    expect(result.errors).toBeDefined();
    expect(result.errors![0].message).toMatch(/not assigned/);
  });
});
