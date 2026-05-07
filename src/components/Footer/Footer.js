import React from 'react';
import Fade from 'react-reveal/Fade';
import NavBrand from '../Navbar/NavBrand';

const Footer = () => {

    const workingHours = [
        'Monday – Sunday',
        '7:00 AM – 10:00 PM',
        '123 Nguyen Hue Street',
        'Da Nang, Vietnam'
    ];

    const services = [
        'Prescription Services',
        'Non-Prescription Medicines',
        'Health & Wellness Consultation',
        'Medical Equipment & Supplies'
    ];

    const contacts = [
        'Hotline: +84 858 765 765',
        'Phone: +84 236 123 4567',
        'Email: contact@longchaupharmacy.com'
    ];

    return (
        <Fade bottom>
        <footer className="text-gray-600 poppins bg-gray-100">
            <div className="max-w-screen-xl px-5 py-10 mx-auto flex md:items-start md:flex-row md:flex-nowrap flex-wrap flex-col">
                
                <div className="w-64 mx-auto md:mx-0 text-center md:text-left">
                    <NavBrand />
                </div>

                <div className="flex-grow flex justify-end flex-wrap md:pl-20 mt-10 md:mt-0 text-center md:text-left">
                    
                    {/* Working Hours */}
                    <div className="lg:w-1/4 md:w-1/2 w-full px-4">
                        <h2 className="text-gray-900 text-base mb-3 font-semibold">Working Hours</h2>
                        <ul className="space-y-2 text-sm">
                            {workingHours.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div className="lg:w-1/4 md:w-1/2 w-full px-4">
                        <h2 className="text-gray-900 text-base mb-3 font-semibold">Services</h2>
                        <ul className="space-y-2 text-sm">
                            {services.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="lg:w-1/4 md:w-1/2 w-full px-4">
                        <h2 className="text-gray-900 text-base mb-3 font-semibold">Contact</h2>
                        <ul className="space-y-2 text-sm">
                            {contacts.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>

                </div>
            </div>

            <div className="bg-blue-700">
                <div className="max-w-screen-xl mx-auto py-3 px-5 text-center">
                    <p className="text-white text-sm">
                        © 2024 Long Chau Pharmacy. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
        </Fade>
    )
}

export default Footer;