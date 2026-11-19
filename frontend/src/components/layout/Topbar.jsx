// import { Menu, Bell, Search } from 'lucide-react'

// export default function Topbar({ onMenu }) {
//   return (
//     <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-800 bg-[#0a0e17]/90 px-4 backdrop-blur sm:px-6 lg:px-8">
//       <button onClick={onMenu} className="text-slate-400 lg:hidden"><Menu size={20} /></button>
//       <div className="relative hidden w-72 sm:block">
//         <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
//         <input placeholder="Search apps, incidents..." className="w-full rounded-lg border border-slate-800 bg-[#0f1523] py-2 pl-9 pr-3 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-blue-500/50" />
//       </div>
//       <div className="ml-auto flex items-center gap-3">
//         <span className="hidden rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 ring-1 ring-amber-500/20 sm:inline">Sample data</span>
//         <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-800">
//           <Bell size={18} />
//           <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
//         </button>
//         <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-semibold text-white">AD</div>
//       </div>
//     </header>
//   )
// }


import { Loader2, Menu, ServerCrash } from 'lucide-react'

export function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
      <Loader2 size={18} className="animate-spin" /> Loading...
    </div>
  )
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
      <ServerCrash className="mx-auto text-red-400" />
      <p className="mt-3 text-sm text-red-300">{message}</p>
      <button onClick={onRetry} className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-xs text-slate-200 hover:bg-slate-700">
        Retry
      </button>
    </div>
  )
}

export default function Topbar({ onMenu }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-800 bg-[#0a0e17]/90 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button onClick={onMenu} className="text-slate-400 lg:hidden" aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="ml-auto flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-semibold text-white">AD</div>
      </div>
    </header>
  )
}