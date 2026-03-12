export type CurrentUser = {
  id: string;
  email: string;
  rolesByHome: Record<string, string[]>;
};

export type RequestContext = {
  requestId: string;
  homeId: string;
  user: CurrentUser;
  ip: string;
};
