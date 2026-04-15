import { DollarSign, Users, ArrowUpRight, Activity } from 'lucide-react';

export const DashboardPage = () => {
  const dummyStats = [
    { label: 'Total Revenue', value: '$45,231', trend: '+20.1%', trendUp: true, icon: DollarSign },
    { label: 'Active Users', value: '2,350', trend: '+15.2%', trendUp: true, icon: Users },
    { label: 'Bounce Rate', value: '12.5%', trend: '-2.4%', trendUp: false, icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back. Here is what's happening with your projects today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dummyStats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-500">{stat.label}</h3>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <div className="flex items-center mt-1 gap-1 text-sm">
                 <ArrowUpRight className={`w-4 h-4 ${stat.trendUp ? 'text-emerald-500' : 'text-rose-500'}`} />
                 <span className={`${stat.trendUp ? 'text-emerald-600' : 'text-rose-600'} font-medium`}>
                   {stat.trend}
                 </span>
                 <span className="text-slate-400 ml-1">from last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dummy Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80 flex items-center justify-center">
          <p className="text-slate-400">Revenue Chart Placeholder</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80 flex items-center justify-center">
          <p className="text-slate-400">Recent Activity Placeholder</p>
        </div>
      </div>
    </div>
  );
};
