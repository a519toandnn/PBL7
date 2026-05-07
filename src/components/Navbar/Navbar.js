import React, { useState } from 'react';
import { HiMenuAlt3 } from 'react-icons/hi';
import { BsSearch } from 'react-icons/bs';
import Fade from 'react-reveal/Fade';
import { NavLink, useHistory } from 'react-router-dom';
import AuthorizeUser from './AuthorizeUser';
import AuthorizeUserMobile from './AuthorizeUserMobile';
import NavBrand from './NavBrand';

const Navbar = () => {
    const [changeHeader, setChangeHeader] = useState(false)
    const [mobileNav, setMobileNav] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const history = useHistory()

    const menu = [
        { id: 1, text: 'Home', to: '/' },
        { id: 2, text: 'Products', to: '/products' },
        { id: 3, text: 'Consultation', to: '/consultation' },
        { id: 4, text: 'Doctor Chat', to: '/doctor-chat' },
        { id: 5, text: 'Contact', to: '/contact' },
    ]

    //handle search
    const handleSearch = (e) => {
        e.preventDefault()
        if (searchTerm.trim()) {
            localStorage.setItem('searchTerm', searchTerm)
            history.push('/products')
            setSearchTerm('')
            setMobileNav(false)
        }
    }

    // Xử lý click nút search
    const handleSearchClick = () => {
        if (searchTerm.trim()) {
            localStorage.setItem('searchTerm', searchTerm)
            history.push('/products')
            setSearchTerm('')
            setMobileNav(false)
        }
    }

    //handle click 
    const handleClick = () => {
        setMobileNav(!mobileNav)
    }
    //header change function 
    const onChangeHeader = () => {
        if (window.scrollY >= 50) {
            setChangeHeader(true)
        } else {
            setChangeHeader(false)
        }
    }

    //change header by scrolling
    window.addEventListener('scroll', onChangeHeader)

    return (
        <header className={changeHeader ? "bg-white fixed z-50 top-0 left-0 w-full shadow-md transition duration-500" : "bg-transparent fixed z-50 top-0 left-0 w-full transition duration-500"}>
            {/* desktop nav  */}
            <nav className="flex items-center max-w-screen-xl mx-auto px-6 py-3">
                {/* brand  */}
                <div className="flex flex-grow">
                    <NavBrand />
                </div>
                {/* menu s */}

                <div className="hidden md:flex lg:flex space-x-8 items-center">
                    <ul className="flex items-center space-x-4">
                        {menu.map(item => (
                            <li key={item.id}>
                                <NavLink exact to={item.to} className="text-gray-600 text-lg poppins" activeClassName="border-b-4 border-blue-600 text-blue-700">{item.text}</NavLink>
                            </li>
                        ))}
                    </ul>

                    {/* Search Bar */}
                    <form onSubmit={handleSearch} className="flex items-center bg-white border border-gray-300 rounded-lg px-2 py-1 w-48">
                        <input 
                            type="text" 
                            placeholder="Search products..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                            className="flex-grow h-8 px-2 outline-none text-sm text-gray-700"
                        />
                        <button type="button" onClick={handleSearchClick} style={{ marginLeft: '-14px' }} className="ml-2 text-gray-600 hover:text-blue-600 flex items-center justify-center w-8 h-8 rounded">
                            <BsSearch className="w-4 h-4" />
                        </button>
                    </form>

                    <AuthorizeUser />
                </div>

                {/* menu icon  */}
                <div className="block md:hidden lg:hidden">
                    <HiMenuAlt3 className="w-10 h-10 ring-blue-300 text-gray-700 border border-gray-400 focus:ring-4 cursor-pointer rounded-lg p-2 transform transition duration-200 hover:scale-110" onClick={handleClick} />
                </div>
            </nav>

            {/* mobile nav  */}
            {mobileNav && (
                <Fade>
                    <nav className="bg-white shadow-lg mx-6 mt-2 p-4 rounded-lg border border-gray-300 py-4 block md:hidden lg:hidden">
                        {/* Mobile Search */}
                        <form onSubmit={handleSearch} className="flex items-center bg-gray-50 border border-gray-300 rounded-lg px-2 py-1 mb-4">
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                                className="flex-grow h-8 px-2 outline-none text-sm text-gray-700 bg-gray-50"
                            />
                            <button type="button" onClick={handleSearchClick} style={{ marginLeft: '-14px' }} className="ml-2 text-gray-600 hover:text-blue-600 flex items-center justify-center w-8 h-8 rounded">
                                <BsSearch className="w-4 h-4" />
                            </button>
                        </form>

                        <ul className="mb-2">
                            {menu.map(item => (
                                <li key={item.id} className="mb-3">
                                    <NavLink exact key={item.id} to={item.to} className="text-gray-600 poppins text-lg text-center py-2 px-3 w-full hover:bg-gray-200 transition duration-300 cursor-default block rounded-lg" activeClassName="border-l-4 border-blue-700 bg-gray-200">
                                    {item.text}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>

                        <div>
                            <AuthorizeUserMobile />
                        </div>
                    </nav>
                </Fade>
            )}
        </header>
    )
}

export default Navbar