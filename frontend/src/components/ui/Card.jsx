export default function Card({ title, action, children, className = '' }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="font-semibold text-gray-800 text-sm">{title}</div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}