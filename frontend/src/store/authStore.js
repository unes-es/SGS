import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      user: null,

      setAuth: (accessToken, user) => set({ accessToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      // Merges into the persisted user object after a self-service
      // profile edit (Topbar's "Mon compte" modal), so the Sidebar's
      // name/initials and everything else reading from the store reflect
      // the change immediately without a full re-login.
      updateUser: (partial) => set((state) => ({ user: { ...state.user, ...partial } })),
      logout: () => set({ accessToken: null, user: null })
    }),
    {
      name: 'sgs-auth',
      partialize: (state) => ({ user: state.user }) // don't persist token
    }
  )
)