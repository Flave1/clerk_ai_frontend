import Link from 'next/link';
import { motion } from 'framer-motion';
import { useUIStore } from '@/store';

interface SocialLink {
  name: string;
  href: string;
}

interface FooterLink {
  label: string;
  onClick?: () => void;
  href?: string;
}

interface LandingFooterProps {
  id?: string;
  socialLinks?: SocialLink[];
  quickLinks?: FooterLink[];
  showQuickLinks?: boolean;
}

export default function LandingFooter({ 
  id,
  socialLinks = [], 
  quickLinks = [],
  showQuickLinks = false 
}: LandingFooterProps) {
  const { theme } = useUIStore();

  return (
    <footer 
      id={id}
      className={`relative py-16 px-4 sm:px-6 lg:px-8 border-t ${
        theme === 'dark' ? 'border-primary-500/20' : 'border-primary-500/30'
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent mb-4"
            >
              Aurray
            </motion.div>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Your voice in every meeting. AI-powered meeting assistance for modern teams.
            </p>
          </div>
          <div>
            <h4 className={`font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>{showQuickLinks ? 'Quick Links' : 'Legal'}</h4>
            <ul className="space-y-2">
              {showQuickLinks && quickLinks.length > 0 ? (
                quickLinks.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <Link
                        href={link.href}
                        className={`transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <button
                        onClick={link.onClick}
                        className={`transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {link.label}
                      </button>
                    )}
                  </li>
                ))
              ) : (
                <>
                  <li>
                    <motion.div whileHover={{ scale: 1.05 }}>
                      <Link
                        href="/privacy-policy"
                        className={`transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Privacy Policy
                      </Link>
                    </motion.div>
                  </li>
                  <li>
                    <motion.div whileHover={{ scale: 1.05 }}>
                      <Link
                        href="/terms-and-conditions"
                        className={`transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:text-white'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Terms and Conditions
                      </Link>
                    </motion.div>
                  </li>
                </>
              )}
            </ul>
          </div>
          <div>
            <h4 className={`font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Connect</h4>
            {socialLinks.length > 0 ? (
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -5 }}
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-gradient-to-r hover:from-primary-500 hover:to-accent-500 transition-all duration-300 ${
                      theme === 'dark'
                        ? 'bg-[#161B22] border-primary-500/20'
                        : 'bg-white border-primary-500/30 shadow-sm'
                    }`}
                  >
                    <span className={`text-xs font-bold ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>{social.name[0]}</span>
                  </motion.a>
                ))}
              </div>
            ) : (
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Questions? Contact us at support@aurray.co.uk
              </p>
            )}
          </div>
        </div>
        <div className={`text-center pt-8 border-t ${
          theme === 'dark' ? 'border-primary-500/20' : 'border-primary-500/30'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                href="/privacy-policy"
                className={`transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Privacy Policy
              </Link>
            </motion.div>
            <span className={theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}>•</span>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Link
                href="/terms-and-conditions"
                className={`transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Terms and Conditions
              </Link>
            </motion.div>
          </div>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Copyright © 2025 Aurray. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

