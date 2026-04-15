const TOKEN_KEY = 'cims_access_token';
const USER_KEY = 'cims_user_data';

export const authStorage = {
    getToken: () => localStorage.getItem(TOKEN_KEY),
    setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    clearToken: () => localStorage.removeItem(TOKEN_KEY),

    getUser: () => {
        const user = localStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    },
    setUser: (user: any) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
    clearUser: () => localStorage.removeItem(USER_KEY),

    clearAll: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }
};
