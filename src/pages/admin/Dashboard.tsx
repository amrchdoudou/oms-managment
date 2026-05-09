import { useEffect, useState } from 'react';

export const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Column */}
      <section className="lg:col-span-2 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border-b-4 border-r-2 border-l border-t border-[#E2E8F0] rounded-xl p-5 shadow-3d-card">
            <div className="text-[0.75rem] text-[#718096] uppercase font-semibold mb-2">Total Orders</div>
            <div className="text-2xl font-bold text-[#1A202C]">{stats?.totalOrders || 0}</div>
            <div className="text-[#48BB78] text-[0.75rem] mt-1 font-medium">+12% from yesterday</div>
          </div>
          
          <div className="bg-white border-b-4 border-r-2 border-l border-t border-[#E2E8F0] rounded-xl p-5 shadow-3d-card">
            <div className="text-[0.75rem] text-[#718096] uppercase font-semibold mb-2">Conversion Rate</div>
            <div className="text-2xl font-bold text-[#1A202C]">4.82%</div>
            <div className="text-[#48BB78] text-[0.75rem] mt-1 font-medium">Healthy traffic</div>
          </div>
          
          <div className="bg-white border-b-4 border-r-2 border-l border-t border-[#E2E8F0] rounded-xl p-5 shadow-3d-card">
            <div className="text-[0.75rem] text-[#718096] uppercase font-semibold mb-2">Revenue (DZD)</div>
            <div className="text-2xl font-bold text-[#1A202C]">{stats?.totalRevenue || 0}</div>
            <div className="text-[#718096] text-[0.75rem] mt-1 font-medium">Estimated net</div>
          </div>
        </div>

        {/* Orders Table Area inside Card */}
        <div className="bg-white border-b-4 border-r-2 border-l border-t border-[#E2E8F0] rounded-xl p-6 shadow-3d-card">
          <h3 className="font-semibold text-lg text-[#1A202C] mb-4">Recent Syncs (Yalidine/Ecotrack)</h3>
          <div className="h-48 flex items-center justify-center text-[#718096] border-2 border-dashed border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
            <div className="text-center">
              <p className="text-sm font-medium">Dashboard Charts & Data</p>
              <ul className="text-xs mt-2 opacity-80">
                {stats?.ordersPerDay?.slice(0,3).map((o: any) => (
                  <li key={o.date}>{o.date}: {o.count} orders</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Sidebar Column */}
      <aside className="space-y-6">
        <div className="bg-white border-b-4 border-r-2 border-l border-t border-[#E2E8F0] rounded-xl p-6 shadow-3d-card">
          <h3 className="font-semibold text-lg text-[#1A202C] mb-4">Live Store Preview</h3>
          <div className="w-[280px] h-[520px] bg-white border-[8px] border-[#334155] rounded-[32px] mx-auto relative overflow-hidden shadow-2xl flex flex-col">
            <div className="h-10 bg-[#F8FAFC] p-3 text-left font-bold text-[0.8rem] border-b border-[#E2E8F0]">Storefront</div>
            <div className="p-3 flex-1 overflow-auto">
              <div className="h-32 bg-[#E2E8F0] rounded-xl mb-3"></div>
              <div className="font-bold text-[0.9rem] text-[#1A202C]">Tactical Messenger Bag</div>
              <div className="text-[#4F46E5] font-bold mt-1">3,500 DZD</div>
              
              <div className="mt-4">
                <div className="text-[0.6rem] text-[#718096] uppercase font-semibold mb-1">Select Size</div>
                <div className="flex gap-1">
                  <div className="w-8 h-6 border border-[#4F46E5] rounded flex justify-center items-center text-[0.6rem] font-medium text-[#4F46E5]">M</div>
                  <div className="w-8 h-6 border border-[#E2E8F0] rounded flex justify-center items-center text-[0.6rem] font-medium text-[#718096]">L</div>
                </div>
              </div>

              <button className="w-full bg-[#1A202C] text-white rounded-full mt-6 py-2 text-[0.8rem] font-semibold">
                Order Now (COD)
              </button>
              
              <div className="mt-4 p-3 bg-[#F1F5F9] rounded-lg text-[0.65rem] text-[#718096]">
                <div className="font-bold text-[#1A202C] mb-1">Fast Delivery in Algeria</div>
                Deliveries via Yalidine & Ecotrack
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
