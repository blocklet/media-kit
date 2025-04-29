// eslint-disable-next-line import/prefer-default-export
export const hasAdminPermission = (user) => {
  return ['admin', 'owner'].includes(user?.role);
};

export const hasMediaKitAccessPermission = (user) => {
  return ['admin', 'owner', 'member', 'pagesEditor', 'blogEditor'].includes(user?.role);
};
