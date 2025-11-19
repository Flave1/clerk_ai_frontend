import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/store';
import { SunIcon, MoonIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface NavItem {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface LandingHeaderProps {
  showAuthButtons?: boolean;
  isAuthenticated?: boolean;
  isCheckingAuth?: boolean;
  onLoginClick?: () => void;
  onDashboardClick?: () => void;
  onEarlyAccessClick?: () => void;
  navItems?: NavItem[];
}

export default function LandingHeader({
  showAuthButtons = false,
  isAuthenticated = false,
  isCheckingAuth = false,
  onLoginClick,
  onDashboardClick,
  onEarlyAccessClick,
  navItems,
}: LandingHeaderProps) {
  const { theme, setTheme } = useUIStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 w-full z-50 backdrop-blur-lg border-b transition-colors duration-200 ${
          theme === 'dark'
            ? 'bg-[#0D1117]/80 border-primary-500/20'
            : 'bg-white/80 border-primary-500/20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent"
              style={theme === 'dark' ? { textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' } : undefined}
            >
              <Link href="/">AURRAY</Link>
            </motion.div>
            
            {/* Desktop Navigation */}
            {navItems && navItems.length > 0 && (
              <div className="hidden lg:flex space-x-6 xl:space-x-8">
                {navItems.map((item) => (
                  item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={`transition-colors duration-200 font-medium text-sm xl:text-base ${
                        theme === 'dark'
                          ? 'text-gray-300 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      onClick={item.onClick}
                      className={`transition-colors duration-200 font-medium text-sm xl:text-base ${
                        theme === 'dark'
                          ? 'text-gray-300 hover:text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  )
                ))}
              </div>
            )}
            
            {/* Desktop Auth Buttons & Theme Toggle */}
            <div className="hidden md:flex items-center gap-2 lg:gap-4">
              {showAuthButtons && !isCheckingAuth && (
                <>
                  {isAuthenticated ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onDashboardClick}
                      className="px-4 lg:px-6 py-2 text-sm lg:text-base bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-300"
                    >
                      Dashboard
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onLoginClick}
                        className={`px-4 lg:px-6 py-2 text-sm lg:text-base font-semibold hover:underline transition-all duration-300 ${
                          theme === 'dark'
                            ? 'text-white'
                            : 'text-gray-700 hover:text-gray-900'
                        }`}
                      >
                        Login
                      </motion.button>
                      {onEarlyAccessClick && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={onEarlyAccessClick}
                          className="px-4 lg:px-6 py-2 text-sm lg:text-base bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-300 whitespace-nowrap"
                        >
                          Get Early Access
                        </motion.button>
                      )}
                    </>
                  )}
                </>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </motion.button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`p-2 rounded-lg transition-all duration-300 ${
                  theme === 'dark'
                    ? 'text-white hover:bg-white/10'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu - Rendered outside nav to avoid stacking context issues */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] md:hidden"
            />
            
            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className={`fixed top-16 right-0 bottom-0 w-80 max-w-[85vw] z-[70] md:hidden overflow-y-auto shadow-2xl ${
                theme === 'dark'
                  ? 'bg-[#0D1117] border-l border-primary-500/20'
                  : 'bg-white border-l border-gray-200'
              }`}
            >
              <div className="flex flex-col p-6 space-y-6">
                {/* Mobile Navigation Items */}
                {navItems && navItems.length > 0 && (
                  <div className="flex flex-col space-y-4">
                    {navItems.map((item) => (
                      item.href ? (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={closeMobileMenu}
                          className={`text-lg font-medium py-2 transition-colors duration-200 ${
                            theme === 'dark'
                              ? 'text-gray-300 hover:text-white'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {item.label}
                        </Link>
                      ) : (
                        <button
                          key={item.label}
                          onClick={() => {
                            if (item.onClick) item.onClick();
                            closeMobileMenu();
                          }}
                          className={`text-lg font-medium py-2 text-left transition-colors duration-200 ${
                            theme === 'dark'
                              ? 'text-gray-300 hover:text-white'
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          {item.label}
                        </button>
                      )
                    ))}
                  </div>
                )}

                {/* Mobile Auth Buttons */}
                {showAuthButtons && !isCheckingAuth && (
                  <div className="flex flex-col space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {isAuthenticated ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (onDashboardClick) onDashboardClick();
                          closeMobileMenu();
                        }}
                        className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-300 text-white"
                      >
                        Dashboard
                      </motion.button>
                    ) : (
                      <>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            if (onLoginClick) onLoginClick();
                            closeMobileMenu();
                          }}
                          className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                            theme === 'dark'
                              ? 'text-white border border-gray-600 hover:bg-gray-800'
                              : 'text-gray-700 border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Login
                        </motion.button>
                        {onEarlyAccessClick && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              if (onEarlyAccessClick) onEarlyAccessClick();
                              closeMobileMenu();
                            }}
                            className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg font-semibold hover:from-primary-600 hover:to-accent-600 transition-all duration-300 text-white"
                          >
                            Get Early Access
                          </motion.button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

