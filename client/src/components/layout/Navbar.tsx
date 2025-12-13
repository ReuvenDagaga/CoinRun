import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', icon: '/ui/Icon_ItemIcons/256/Icon_Shop.png', label: 'Home' },
  { path: '/shop', icon: '/ui/Icon_ItemIcons/256/Icon_Shop.png', label: 'Shop' },
  { path: '/leaderboard', icon: '/ui/Icon_ItemIcons/256/Icon_Trophy.png', label: 'Ranks' },
  { path: '/profile', icon: '/ui/profile.png', label: 'Profile' }
];

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-gray-900/95 backdrop-blur-md border-t border-gray-700/50 safe-area-pb">
      <div className="flex justify-around items-center h-20 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/40 scale-110 -translate-y-2'
                  : 'bg-gray-800/50 hover:bg-gray-700/50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <img
                  src={item.icon}
                  alt={item.label}
                  className={`w-7 h-7 mb-1 transition-all duration-300 ${
                    isActive ? 'brightness-0 invert' : 'opacity-60'
                  }`}
                />
                <span className={`text-[10px] font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-gray-400'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}