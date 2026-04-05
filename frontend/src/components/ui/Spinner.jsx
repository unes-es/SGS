export default function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}