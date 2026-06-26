import { GraphQLError } from "graphql";
import type { Camera, User } from "./types.js";

const cameras: Camera[] = [
  { id: "0", name: "A8207-VE MKII", address: "192.168.1.101" },
  {
    id: "1",
    name: "I8307-VE",
    niceName: "My Device",
    address: "192.168.1.102",
  },
];

const users: User[] = [
  { id: "1", username: "alice", cameraIds: ["0"] },
  { id: "2", username: "bob", cameraIds: ["1"] },
];

const passwords: Record<string, string> = {
  alice: "password",
  bob: "password",
};

export function findUserByCredentials(
  username: string,
  password: string,
): User | null {
  if (passwords[username] !== password) return null;
  return users.find((u) => u.username === username) ?? null;
}

export function getUserById(id: string): User | null {
  return users.find((u) => u.id === id) ?? null;
}

export function getAllCameras(): Camera[] {
  return cameras;
}

export function getCameraById(id: string): Camera | null {
  return cameras.find((c) => c.id === id) ?? null;
}

export function getCamerasForUser(user: User): Camera[] {
  return user.cameraIds.map((id) => {
    const camera = getCameraById(id);
    if (!camera) throw new GraphQLError(`Camera '${id}' not found`);
    return camera;
  });
}

export function addCameraToUser(user: User, cameraId: string): void {
  if (!getCameraById(cameraId)) {
    throw new GraphQLError(`Camera '${cameraId}' does not exist`);
  }
  if (user.cameraIds.includes(cameraId)) return;
  user.cameraIds.push(cameraId);
}

export function removeCameraFromUser(user: User, cameraId: string): void {
  if (!getCameraById(cameraId)) {
    throw new GraphQLError(`Camera '${cameraId}' does not exist`);
  }
  if (!user.cameraIds.includes(cameraId)) {
    throw new GraphQLError(`Camera '${cameraId}' is not assigned to this user`);
  }
  user.cameraIds = user.cameraIds.filter((id) => id !== cameraId);
}
