const variants = {
  default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 ring-1 ring-emerald-200/60 dark:ring-emerald-800/40',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400 ring-1 ring-amber-200/60 dark:ring-amber-800/40',
  danger: 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-400 ring-1 ring-red-200/60 dark:ring-red-800/40',
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-950/50 dark:text-primary-400 ring-1 ring-primary-200/60 dark:ring-primary-800/40',
};

const Badge = ({ children, variant = 'default', className = '' }) => (
  <span className={`ds-badge ${variants[variant]} ${className}`}>
    {children}
  </span>
);

export default Badge;
