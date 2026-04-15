import { Route, Routes, useParams } from 'react-router-dom'
import ForbiddenPage from '../page/ForbiddenPage'
import NotFoundPage from '../page/NotFoundPage'
import UserManagementPage from './users/UserManagementPage'
import EventPage from './events/EventPage'
import AdminEventDetailPage from './events/AdminEventDetailPage'
import CreateEventPage from './events/CreateEventPage'
import EditEventPage from './events/EditEventPage'
import SemestersPage from './semesters/SemestersPage'
import UnitsManagementPage from './units/UnitsManagementPage'

import StaffUnitsWorkspace from './members/StaffUnitsWorkspace'
import StaffReportsPanel from './reports/StaffReportsPanel'
import StaffAssignedEventsPanel from './tasks/StaffAssignedEventsPanel'
import { hasManageAccess, getManageRoleForUnit, USER_ROLES } from '../utils/routes'
import routerStyles from './adminRouter.module.css'

const FORBIDDEN_UNIT = 'Admin hoặc Manager tại đơn vị đã chọn'

function AdminUserManagementView({ accessToken, role, roleLabel, onSessionExpired }) {
  return (
    <UserManagementPage
      accessToken={accessToken}
      role={role}
      roleLabel={roleLabel}
      pageTitle="Quản trị người dùng"
      pageDescription="ADMIN có thể xem toàn bộ user, tạo user mới, chỉnh sửa user khác và phân quyền RBAC."
      onSessionExpired={onSessionExpired}
    />
  )
}

function PickUnitCard() {
  return (
    <section className={`page-card ${routerStyles.pickUnitCard}`}>
      <h1>Vui lòng chọn đơn vị để bắt đầu quản trị</h1>
    </section>
  )
}

function StaffUnitsPanelView({ accessToken, selectedUnitId, staffPanel, onSessionExpired }) {
  const activePanel = ['members', 'reports', 'events'].includes(staffPanel) ? staffPanel : 'members'
  if (activePanel === 'reports') {
    return <StaffReportsPanel />
  }
  if (activePanel === 'events') {
    return <StaffAssignedEventsPanel />
  }
  return (
    <StaffUnitsWorkspace
      accessToken={accessToken}
      selectedUnitId={selectedUnitId}
      activePanel={activePanel}
      onSessionExpired={onSessionExpired}
    />
  )
}

function AdminStaffRoute({ staffPanel, user, accessToken, onSessionExpired }) {
  const { unitId } = useParams()
  const scopedRole = getManageRoleForUnit(user, unitId)
  if (scopedRole !== USER_ROLES.staff) {
    if (!scopedRole) {
      return <ForbiddenPage requiredRoleLabel={FORBIDDEN_UNIT} />
    }
    return <NotFoundPage />
  }
  return (
    <StaffUnitsPanelView
      accessToken={accessToken}
      selectedUnitId={unitId}
      staffPanel={staffPanel}
      onSessionExpired={onSessionExpired}
    />
  )
}

function AdminManagerUsersRoute({ user, roleLabel, accessToken, onSessionExpired }) {
  const { unitId } = useParams()
  const scopedRole = getManageRoleForUnit(user, unitId)
  if (scopedRole === USER_ROLES.staff) {
    return <NotFoundPage />
  }
  if (scopedRole !== USER_ROLES.admin && scopedRole !== USER_ROLES.manager) {
    return <ForbiddenPage requiredRoleLabel={FORBIDDEN_UNIT} />
  }
  return (
    <AdminUserManagementView
      accessToken={accessToken}
      roleLabel={roleLabel}
      role={scopedRole}
      onSessionExpired={onSessionExpired}
    />
  )
}

function AdminManagerUnitsRoute({ navigate, user, roleLabel, accessToken, onSessionExpired }) {
  const { unitId } = useParams()
  const scopedRole = getManageRoleForUnit(user, unitId)
  if (scopedRole === USER_ROLES.staff) {
    return <NotFoundPage />
  }
  if (scopedRole !== USER_ROLES.admin && scopedRole !== USER_ROLES.manager) {
    return <ForbiddenPage requiredRoleLabel={FORBIDDEN_UNIT} />
  }
  return (
    <UnitsManagementPage
      accessToken={accessToken}
      role={scopedRole}
      roleLabel={roleLabel}
      user={user}
      navigate={navigate}
      onSessionExpired={onSessionExpired}
    />
  )
}

function AdminManagerEventsRoute({ navigate, user }) {
  const { unitId } = useParams()
  const scopedRole = getManageRoleForUnit(user, unitId)
  if (scopedRole === USER_ROLES.staff) {
    return <NotFoundPage />
  }
  if (scopedRole !== USER_ROLES.admin && scopedRole !== USER_ROLES.manager) {
    return <ForbiddenPage requiredRoleLabel={FORBIDDEN_UNIT} />
  }
  return <EventPage navigate={navigate} adminUnitId={unitId} />
}

function AdminManagerEventDetailRoute({ user }) {
  const { unitId, eventScope, eventId } = useParams()
  if (eventScope !== 'p' && eventScope !== 'u') {
    return <NotFoundPage />
  }
  const scopedRole = getManageRoleForUnit(user, unitId)
  if (scopedRole === USER_ROLES.staff) {
    return <NotFoundPage />
  }
  if (scopedRole !== USER_ROLES.admin && scopedRole !== USER_ROLES.manager) {
    return <ForbiddenPage requiredRoleLabel={FORBIDDEN_UNIT} />
  }
  return (
    <AdminEventDetailPage
      adminUnitId={unitId}
      eventId={eventId}
      eventScope={eventScope}
    />
  )
}

function AdminManagerSemestersRoute({ user, roleLabel, accessToken, onSessionExpired }) {
  const { unitId } = useParams()
  const scopedRole = getManageRoleForUnit(user, unitId)
  if (scopedRole === USER_ROLES.staff) {
    return <NotFoundPage />
  }
  if (scopedRole !== USER_ROLES.admin && scopedRole !== USER_ROLES.manager) {
    return <ForbiddenPage requiredRoleLabel={FORBIDDEN_UNIT} />
  }
  return (
    <SemestersPage
      accessToken={accessToken}
      role={scopedRole}
      roleLabel={roleLabel}
      onSessionExpired={onSessionExpired}
    />
  )
}

/** /admin/:unitId — URL chỉ có đơn vị: panel mặc định theo role */
function AdminUnitHomeRoute({ user, roleLabel, accessToken, onSessionExpired }) {
  const { unitId } = useParams()
  const scopedRole = getManageRoleForUnit(user, unitId)
  if (!scopedRole) {
    return <ForbiddenPage requiredRoleLabel={FORBIDDEN_UNIT} />
  }
  if (scopedRole === USER_ROLES.staff) {
    return (
      <StaffUnitsPanelView
        accessToken={accessToken}
        selectedUnitId={unitId}
        staffPanel="members"
        onSessionExpired={onSessionExpired}
      />
    )
  }
  if (scopedRole === USER_ROLES.admin || scopedRole === USER_ROLES.manager) {
    return (
      <AdminUserManagementView
        accessToken={accessToken}
        roleLabel={roleLabel}
        role={scopedRole}
        onSessionExpired={onSessionExpired}
      />
    )
  }
  return <ForbiddenPage requiredRoleLabel={FORBIDDEN_UNIT} />
}

export default function AdminRouter({
  navigate,
  user,
  roleLabel,
  accessToken,
  onSessionExpired,
}) {
  if (!hasManageAccess(user)) {
    return <ForbiddenPage requiredRoleLabel="Admin, Manager hoặc Staff" />
  }

  const shared = {
    navigate,
    user,
    roleLabel,
    accessToken,
    onSessionExpired,
  }

  return (
    <Routes>
      <Route path="/admin" element={<PickUnitCard />} />

      <Route
        path="/admin/:unitId/events/:eventScope/:eventId"
        element={<AdminManagerEventDetailRoute {...shared} />}
      />
      <Route path="/admin/:unitId/events" element={<AdminManagerEventsRoute {...shared} />} />

      <Route
        path="/admin/:unitId/events/create"
        element={<CreateEventPage {...shared} />}
      />
      <Route
        path="/admin/:unitId/events/:eventScope/:eventId/edit"
        element={<EditEventPage {...shared} />}
      />
      <Route path="/admin/:unitId/users" element={<AdminManagerUsersRoute {...shared} />} />
      <Route path="/admin/:unitId/units" element={<AdminManagerUnitsRoute {...shared} />} />
      <Route path="/admin/:unitId/semesters" element={<AdminManagerSemestersRoute {...shared} />} />

      <Route
        path="/admin/:unitId/members"
        element={<AdminStaffRoute {...shared} staffPanel="members" />}
      />
      <Route
        path="/admin/:unitId/reports"
        element={<AdminStaffRoute {...shared} staffPanel="reports" />}
      />
      <Route
        path="/admin/:unitId/tasks"
        element={<AdminStaffRoute {...shared} staffPanel="events" />}
      />

      <Route path="/admin/:unitId" element={<AdminUnitHomeRoute {...shared} />} />
      <Route path="/admin/:unitId/*" element={<NotFoundPage />} />
    </Routes>
  )
}
