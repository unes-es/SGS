import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      user: null,

      setAuth: (accessToken, user) => set({ accessToken, user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ accessToken: null, user: null })
    }),
    {
      name: 'sgs-auth',
      partialize: (state) => ({ user: state.user }) // don't persist token
    }
  )
)