export default function StatCard({ icon, label, value, delta, deltaUp, bg = 'bg-blue-50' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 lg:p-5 flex flex-col lg:flex-row items-center lg:items-start gap-2 lg:gap-4 text-center lg:text-left">
      <div className={`w-10 h-10 lg:w-11 lg:h-11 ${bg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-base lg:text-2xl font-bold text-gray-900 leading-tight">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5 leading-tight">{label}</div>
        {delta && (
          <div className={`text-xs font-semibold mt-1 ${deltaUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {deltaUp ? '↑' : '↓'} {delta}
          </div>
        )}
      </div>
    </div>
  )
}