import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/shop', icon: '/ui/Shop.Png', label: 'Shop' },
  { path: '/cards', icon: '/ui/Cards.Png', label: 'Cards' },
  { path: '/', icon: '/ui/Home.Png', label: 'Home' },
  { path: '/leaderboard', icon: '/ui/Trophy.Png', label: 'Ranks' },
  { path: '/profile', icon: '/ui/profile.png', label: 'Profile' }
];

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 safe-area-pb">
      <div className="relative h-28 rounded-t-3xl shadow-2xl shadow-cyan-500/40">
        <div className="absolute inset-0 top-0 h-1/2 bg-gradient-to-r from-sky-500 via-cyan-400 to-sky-400 rounded-t-3xl" />
        <div className="absolute inset-0 top-1/2 h-1/2 bg-gradient-to-r from-sky-600 via-cyan-500 to-sky-500" />
        <div className="absolute left-4 right-4 top-1/2 h-[2px] bg-white/20" />
        <div className="relative flex justify-around items-end h-full px-4 pb-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center justify-end"
            >
              {({ isActive }) => (
                <>
                  <div className={`relative flex items-center justify-center w-16 h-16 transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-b from-yellow-400 to-orange-500 rounded-2xl border-4 border-yellow-300 shadow-lg shadow-orange-500/50' 
                      : 'opacity-70 hover:opacity-100'
                  }`}>
                    <img
                      src={item.icon}
                      alt={item.label}
                      className="w-13 h-13 object-contain"
                    />
                  </div>
                  <span 
                    className="text-base font-bold text-white"
                    style={{
                      textShadow: `-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000, 2px 2px 2px rgba(0,0,0,0.5)`
                    }}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-1 w-12 h-1.5 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/60" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}