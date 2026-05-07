import React, { createContext, useEffect } from 'react';
import useAuthBackend from '../hooks/useAuthBackend';

//create an auth context 
export const AuthContext = createContext();

const AuthProvider = ({children}) => {
    const authData = useAuthBackend();
    
    // Check if user is already logged in when component mounts
    useEffect(() => {
        authData.checkUser();
        // authData intentionally omitted from deps (functions not memoized)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    return (
        <AuthContext.Provider value={authData}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthProvider
