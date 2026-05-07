import React from 'react';
import { BsCart2 } from 'react-icons/bs';
import { useHistory } from "react-router-dom";
import useAuth from '../../hooks/useAuth';
import useOrder from '../../hooks/useOrder';
import Button from '../Form/Button';

const AuthorizeUserMobile = () => {
    const { user, logOut } = useAuth();
    const history = useHistory();
    const { orders } = useOrder();
    
    // Get user display name - from backend it's full_name, from legacy it's displayName
    const displayName = user?.full_name || user?.displayName || 'User';
    // Use a default avatar URL since backend doesn't provide images yet
    const avatarUrl = "https://cdn-icons-png.flaticon.com/512/236/236832.png";

    return (
        <>
            {
                user?.email ? (
                    <>
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative flex cursor-pointer" onClick={() => history.push('/orders')}>
                                <span className="bg-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-white poppins absolute -right-2 -top-2">{orders.length}</span>
                                <BsCart2 className="cursor-pointer w-6 h-6 text-gray-700" />
                            </div>
                            <img 
                                src={avatarUrl}
                                alt={displayName} 
                                className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition" 
                                onClick={() => history.push('/profile')}
                            />
                            <Button className="btn-primary w-full py-3 poppins" onClick={() => history.push('/profile')} text="Hồ Sơ Của Tôi" />
                            <Button className="btn-primary w-full py-3 poppins bg-red-600 hover:bg-red-700" onClick={logOut} text="Đăng Xuất" />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-center space-x-6">
                            <button className="poppins" onClick={() => history.push('/signin')}>Đăng Nhập</button>
                            <button className=" btn-primary px-6 py-3  rounded-full" onClick={() => history.push('/signup')}>Đăng Ký</button>
                        </div>
                    </>
                )
            }
        </>
    )
}

export default AuthorizeUserMobile
