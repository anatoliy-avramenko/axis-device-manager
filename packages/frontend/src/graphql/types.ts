// Hand-written types mirroring the GraphQL contract exactly.
// Do NOT rename these fields — they must match the backend SDL.

export interface Camera {
  id: string;
  name: string;
  niceName?: string | null;
  address: string;
}

export interface User {
  id: string;
  username: string;
  cameras: Camera[];
}

export interface AuthPayload {
  token: string;
  user: User;
}

// Per-operation result and variable types

export interface LoginVars {
  username: string;
  password: string;
}

export interface LoginData {
  login: AuthPayload;
}

export interface MeData {
  me: User | null;
}

export interface AddCameraToUserVars {
  cameraId: string;
}

export interface AddCameraToUserData {
  addCameraToUser: User;
}

export interface RemoveCameraFromUserVars {
  cameraId: string;
}

export interface RemoveCameraFromUserData {
  removeCameraFromUser: User;
}

export interface CamerasData {
  cameras: Camera[];
}

export interface AddCameraVars {
  name: string;
  niceName?: string;
  address: string;
}

export interface AddCameraData {
  addCamera: Camera;
}
