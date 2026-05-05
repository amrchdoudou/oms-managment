import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, Settings, LayoutDashboard, LogOut, Truck, Palette, PenTool } from 'lucide-react';
import { useEffect } from 'react';

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('saas_token')) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('saas_token');
    navigate('/login');
  };

  const links = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
    { to: '/admin/products', icon: Package, label: 'Form Builder' },
    { to: '/admin/product-designer', icon: PenTool, label: 'Product Designer' },
    { to: '/admin/store-builder', icon: Palette, label: 'Landing Page Designer' },
    { to: '/admin/shipping-fees', icon: Truck, label: 'Shipping Fees' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-[#F4F7FA] font-sans text-[#1A202C] overflow-hidden">
      {/* Sidebar */}
      <div className="w-[240px] bg-[#0F172A] text-[#94A3B8] border-r border-[#E2E8F0] flex flex-col shrink-0">
        <div className="p-6 text-white font-bold text-xl flex items-center gap-3">
          <Link to="/" className="text-white hover:opacity-80 transition-opacity">Mstore Admin</Link>
          <span className="text-[11px] bg-[#4F46E5] px-1.5 py-0.5 rounded text-white font-medium">SaaS</span>
        </div>
        <nav className="p-3 flex-1 space-y-1">
          {links.map(link => {
            const active = location.pathname.startsWith(link.to) && link.to !== '/admin' || (location.pathname === '/admin' && link.to === '/admin');
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  active 
                    ? 'bg-[#334155] text-white' 
                    : 'text-[#94A3B8] hover:bg-[#334155]/50 hover:text-white'
                }`}
              >
                <link.icon size={20} className={active ? 'text-white' : ''} />
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-6 border-t border-[#334155]">
          <div className="text-[13px] text-white font-medium mb-3">Mstore Hub</div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors text-sm w-full font-medium">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8 shrink-0">
          <div className="font-semibold text-[#1A202C]">Control Center</div>
          <div className="flex items-center gap-4">
            <span className="text-[#718096] text-sm">Auto-syncing active...</span>
            <Link to="/admin/products">
              <button className="bg-[#4F46E5] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors">
                + New Product
              </button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};
