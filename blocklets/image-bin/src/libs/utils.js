// eslint-disable-next-line import/prefer-default-export
export const hasAdminPermission = (user) => {
  return ['admin', 'owner'].includes(user?.role);
};
