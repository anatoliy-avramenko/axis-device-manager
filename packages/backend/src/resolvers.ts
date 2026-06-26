import { GraphQLError } from "graphql";
import {
  findUserByCredentials,
  getAllCameras,
  getCamerasForUser,
  addCameraToUser,
  removeCameraFromUser,
} from "./data.js";
import { issueToken } from "./auth.js";
import type { Camera, User, Context } from "./types.js";

export const resolvers = {
  Query: {
    cameras: () => getAllCameras(),
    me: (_parent: unknown, _args: unknown, ctx: Context) => ctx.currentUser,
  },

  Mutation: {
    login: (_parent: unknown, args: { username: string; password: string }) => {
      const user = findUserByCredentials(args.username, args.password);
      if (!user) throw new GraphQLError("Invalid credentials");
      const token = issueToken(user.id);
      return { token, user };
    },

    addCamera: (_parent: unknown, args: Omit<Camera, "id">, ctx: Context) => {
      if (!ctx.currentUser) throw new GraphQLError("Not authenticated");
      const cameras = getAllCameras();
      const id = `${cameras.length}`;
      const camera: Camera = { id, ...args };
      cameras.push(camera);
      return camera;
    },

    addCameraToUser: (
      _parent: unknown,
      args: { cameraId: string },
      ctx: Context,
    ) => {
      if (!ctx.currentUser) throw new GraphQLError("Not authenticated");
      addCameraToUser(ctx.currentUser, args.cameraId);
      return ctx.currentUser;
    },

    removeCameraFromUser: (
      _parent: unknown,
      args: { cameraId: string },
      ctx: Context,
    ) => {
      if (!ctx.currentUser) throw new GraphQLError("Not authenticated");
      removeCameraFromUser(ctx.currentUser, args.cameraId);
      return ctx.currentUser;
    },
  },

  User: {
    cameras: (parent: User) => getCamerasForUser(parent),
  },

  Camera: {
    id: (parent: Camera) => parent.id,
    name: (parent: Camera) => parent.name,
    niceName: (parent: Camera) => parent.niceName,
    address: (parent: Camera) => parent.address,
  },
};
