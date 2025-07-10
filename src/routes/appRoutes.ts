export const AppRoutes = {
  // Public/Marketing Routes
  HOME: '/',
  SALONS: '/salons',
  SALON_DETAIL: (salonId: string) => `/salons/${salonId}`,

  // Authentication Routes
  LOGIN: '/login',
  REGISTER_USER: '/register-user',

  // Dashboard Routes (Protected)

  // Regular User Dashboard Routes
  USER_DASHBOARD: '/dashboard/user',
  USER_BOOKINGS: '/dashboard/user/bookings',
  BOOK_SALON_VISIT: (salonId: string) => `/salons/${salonId}/book`,

  // Salon User Dashboard Routes
  SALON_DASHBOARD: '/dashboard/salon',
  SALON_PROFILE: '/dashboard/salon/profile',
  SALON_STAFF: '/dashboard/salon/staff',
  SALON_SERVICES: '/dashboard/salon/services',
  SALON_BOOKINGS: '/dashboard/salon/bookings',
  SALON_CALENDAR: '/dashboard/salon/calendar',

  // Admin User Dashboard Routes
  ADMIN_DASHBOARD: '/dashboard/admin',
  ADMIN_USERS: '/dashboard/admin/users',
  ADMIN_SALONS: '/dashboard/admin/salons',
  ADMIN_SETTINGS: '/dashboard/admin/settings',
};