const Input = ({ label, error, className = '', ...props }) => (
  <div className={className}>
    {label && (
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
    )}
    <input className="ds-input" {...props} />
    {error && <p className="text-red-500 text-xs mt-1.5 font-medium">{error}</p>}
  </div>
);

export default Input;
