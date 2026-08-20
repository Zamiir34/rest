const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-1">
    <div>
      <p className="system-kicker mb-2">Workspace</p>
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
        {title}
      </h1>
      {subtitle && (
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">{subtitle}</p>
      )}
    </div>
    {action && <div className="flex items-center gap-3 shrink-0">{action}</div>}
  </div>
);

export default PageHeader;
