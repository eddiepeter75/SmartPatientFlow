import { useState } from "react";
import { Link, useLocation } from "wouter";

export default function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-primary-700 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <i className="fas fa-hospital-alt text-2xl mr-3"></i>
            <h1 className="text-2xl font-bold">Hospital Queue System</h1>
          </div>
          <nav className="hidden md:flex space-x-6 text-sm font-medium">
            <Link href="/">
              <a className={`py-2 px-3 rounded-md ${location === '/' ? 'bg-primary-800' : 'hover:bg-primary-600'}`}>
                Reception
              </a>
            </Link>
            <Link href="/triage">
              <a className={`py-2 px-3 rounded-md ${location === '/triage' ? 'bg-primary-800' : 'hover:bg-primary-600'}`}>
                Triage
              </a>
            </Link>
            <Link href="/doctor">
              <a className={`py-2 px-3 rounded-md ${location === '/doctor' ? 'bg-primary-800' : 'hover:bg-primary-600'}`}>
                Doctor
              </a>
            </Link>
            <Link href="/display">
              <a className={`py-2 px-3 rounded-md ${location === '/display' ? 'bg-primary-800' : 'hover:bg-primary-600'}`}>
                Display
              </a>
            </Link>
            <Link href="/analytics">
              <a className={`py-2 px-3 rounded-md ${location === '/analytics' ? 'bg-primary-800' : 'hover:bg-primary-600'}`}>
                Analytics
              </a>
            </Link>
          </nav>
          <button className="md:hidden text-white" onClick={toggleMobileMenu}>
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>
        
        {/* Mobile navigation menu */}
        <div className={`md:hidden ${mobileMenuOpen ? '' : 'hidden'}`}>
          <div className="flex flex-col space-y-2 mt-4 pb-3">
            <Link href="/">
              <a className={`py-2 px-3 rounded-md ${location === '/' ? 'bg-primary-800' : 'hover:bg-primary-600'}`}>
                Reception
              </a>
            </Link>
            <Link href="/triage">
              <a className={`py-2 px-3 rounded-md ${location === '/triage' ? 'bg-primary-800' : 'hover:bg-primary-600'}`}>
                Triage
              </a>
            </Link>
            <Link href="/doctor">
              <a className={`py-2 px-3 rounded-md ${location === '/doctor' ? 'bg-primary-800' : 'hover:bg-primary-600'}`}>
                Doctor
              </a>
            </Link>
            <Link href="/display">
              <a className={`py-2 px-3 rounded-md ${location === '/display' ? 'bg-primary-800' : 'hover:bg-primary-600'}`}>
                Display
              </a>
            </Link>
            <Link href="/analytics">
              <a className={`py-2 px-3 rounded-md ${location === '/analytics' ? 'bg-primary-800' : 'hover:bg-primary-600'}`}>
                Analytics
              </a>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
