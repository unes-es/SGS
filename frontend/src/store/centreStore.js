import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// SUPER_ADMIN is the only role the backend lets override centreId (every
// other role is always scoped to their own centre via the JWT, regardless
// of what's sent here - see e.g. eleves.controller.js's
// `req.user.role === 'SUPER_ADMIN' ? req.query.centreId || req.user.centreId
// : req.user.centreId` pattern, repeated across ~10 modules). This store
// only matters for that one role; every other role's pages should just
// ignore it and let the backend fall back to their own centreId.
//
// null means "no override" - pages should omit centreId from their query
// entirely rather than sending null, so non-SUPER_ADMIN users (and a
// SUPER_ADMIN who hasn't picked one yet) fall through to the backend's own
// req.user.centreId default.
export const useCentreStore = create(
  persist(
    (set) => ({
      selectedCentreId: null,
      setSelectedCentreId: (centreId) => set({ selectedCentreId: centreId }),
    }),
    { name: 'sgs-centre' }
  )
)
