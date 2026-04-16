interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export default function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <div className="relative inline-flex items-center">
      <select
        {...props}
        className={`
          appearance-none bg-[#1a1a1a] border border-[#2a2a2a] text-white text-sm
          rounded-lg pl-4 pr-9 py-2.5 cursor-pointer
          hover:border-[#e10600]/50 hover:bg-[#222]
          focus:outline-none focus:border-[#e10600] focus:ring-1 focus:ring-[#e10600]/30
          transition-colors
          ${className}
        `}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 text-[#666] shrink-0"
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
      >
        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
