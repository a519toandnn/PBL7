import React from 'react';
import { BsCart2 } from 'react-icons/bs';
import { FiLogOut } from 'react-icons/fi';
import { MdAdminPanelSettings } from 'react-icons/md';
import { useHistory } from "react-router-dom";
import useAuth from '../../hooks/useAuth';
import useOrder from '../../hooks/useOrder';

const AuthorizeUser = () => {
    const { user, logOut } = useAuth();
    const history = useHistory();
    const { orders } = useOrder();
    const isAdmin = user?.role === 'ADMIN' || false;
    
    // Get user display name - from backend it's full_name, from legacy it's displayName
    const displayName = user?.full_name || user?.displayName || 'User';
    // Use a default avatar URL since backend doesn't provide images yet
    const avatarUrl = "https://cdn-icons-png.flaticon.com/512/236/236832.png";

    return (
        <>
            {
                user?.email ? (
                    <>
                        <div className="flex items-center justify-end space-x-4">
                            {isAdmin && (
                                <MdAdminPanelSettings 
                                    className="cursor-pointer w-6 h-6 text-purple-600 hover:text-purple-800 transition" 
                                    onClick={() => history.push('/admin')}
                                    title="Admin Panel"
                                />
                            )}
                            <div className="relative flex cursor-pointer" onClick={() => history.push('/orders')}>
                                <span className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-white poppins absolute -right-2 -top-2">{orders.length}</span>
                                <BsCart2 className="cursor-pointer w-6 h-6 text-gray-700" />
                            </div>
                            <img 
                                src={avatarUrl}
                                alt={displayName} 
                                className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition" 
                                onClick={() => history.push('/profile')}
                                title="Go to profile"
                            />

                            <p 
                                className="text-gray-700 poppins hidden md:block lg:block cursor-pointer hover:text-blue-600 transition"
                                onClick={() => history.push('/profile')}
                            >
                                {displayName}
                            </p>
                            <FiLogOut className="cursor-pointer w-6 h-6 text-gray-700 hover:text-red-600 transition" onClick={logOut} title="Sign Out" />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-end space-x-6">
                            <button className="poppins" onClick={() => history.push('/signin')}>Đăng Nhập</button>
                            <button className="btn-primary px-6 py-3  rounded-full" onClick={() => history.push('/signup')}>Đăng Ký</button>
                        </div>
                    </>
                )
            }
        </>
    )
}

export default AuthorizeUser
