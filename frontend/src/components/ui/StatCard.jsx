export default function StatCard({ icon, label, value, delta, deltaUp, bg = 'bg-blue-50' }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4">
      <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 leading-none">{value}</div>
        <div className="text-sm text-gray-500 mt-1">{label}</div>
        {delta && (
          <div className={`text-xs font-semibold mt-1 ${deltaUp ? 'text-emerald-600' : 'text-red-500'}`}>
            {deltaUp ? '↑' : '↓'} {delta}
          </div>
        )}
      </div>
    </div>
  )
}