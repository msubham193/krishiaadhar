import { create } from 'zustand'


export const useUserStore = create((set) => ({
    bears: 0,
    userData: {
      email: null,
      name: null,
      phoneNumber: null,
      profilePic: null,
      role: null,
      token: null,
    },
    setUserData:(data) => set({ userData: data }), // Function to set userData
    resetUserData: () => set({
        userData: {
          email: null,
          name: null,
          phoneNumber: null,
          profilePic: null,
          role: null,
          token: null,
        },
      }),
  }));