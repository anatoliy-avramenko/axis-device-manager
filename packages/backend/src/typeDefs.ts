export const typeDefs = /* GraphQL */ `
  type Query {
    cameras: [Camera!]!
    me: User
  }

  type Mutation {
    login(username: String!, password: String!): AuthPayload!
    addCamera(name: String!, niceName: String, address: String!): Camera!
    addCameraToUser(cameraId: ID!): User!
    removeCameraFromUser(cameraId: ID!): User!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type User {
    id: ID!
    username: String!
    cameras: [Camera!]!
  }

  type Camera {
    id: ID!
    name: String!
    niceName: String
    address: String!
  }
`;
