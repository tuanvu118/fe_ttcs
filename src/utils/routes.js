export const PATHS = {
  home: '/',
  event: '/event',
  about: '/about',
  login: '/login',
  register: '/register',
  profile: '/profile',
  admin: '/admin',
  logout: '/logout',
}

export const primaryNavigation = [
  { path: PATHS.home, label: 'Trang chủ' },
  { path: PATHS.event, label: 'Sự kiện' },
  { path: PATHS.about, label: 'Cổng thông tin' },
]

const routeMeta = {
  [PATHS.home]: { title: 'Trang chủ' },
  [PATHS.event]: { title: 'Sự kiện' },
  [PATHS.about]: { title: 'Cổng thông tin' },
  [PATHS.login]: { title: 'Đăng nhập' },
  [PATHS.register]: { title: 'Đăng ký' },
  [PATHS.profile]: { title: 'Hồ sơ', requiresAuth: true },
  [PATHS.admin]: { title: 'Quản trị', requiresAuth: true, requiresAdmin: true },
  [PATHS.logout]: { title: 'Đăng xuất', requiresAuth: true },
}

export function getRouteMeta(pathname) {
  return routeMeta[pathname] ?? null
}
