export type Camera = {
  id: string;
  name: string;
  niceName?: string;
  address: string;
};

export type User = {
  id: string;
  username: string;
  cameraIds: string[];
};

export type Context = {
  currentUser: User | null;
};
