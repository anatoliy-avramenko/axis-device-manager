// GraphQL document strings for all operations.
// Consumed by urql hooks throughout the app.

export const LOGIN = `
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user {
        id
        username
        cameras {
          id
          name
          niceName
          address
        }
      }
    }
  }
`;

export const ME = `
  query Me {
    me {
      id
      username
      cameras {
        id
        name
        niceName
        address
      }
    }
  }
`;

export const CAMERAS = `
  query Cameras {
    cameras {
      id
      name
      niceName
      address
    }
  }
`;

export const ADD_CAMERA_TO_USER = `
  mutation AddCameraToUser($cameraId: ID!) {
    addCameraToUser(cameraId: $cameraId) {
      id
      username
      cameras {
        id
        name
        niceName
        address
      }
    }
  }
`;

export const REMOVE_CAMERA_FROM_USER = `
  mutation RemoveCameraFromUser($cameraId: ID!) {
    removeCameraFromUser(cameraId: $cameraId) {
      id
      username
      cameras {
        id
        name
        niceName
        address
      }
    }
  }
`;

export const ADD_CAMERA = `
  mutation AddCamera($name: String!, $address: String!, $niceName: String) {
    addCamera(name: $name, address: $address, niceName: $niceName) {
      id
      name
      niceName
      address
    }
  }
`;
