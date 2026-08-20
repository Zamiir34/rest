const Card = ({ children, className = '', hover = false, padding = true }) => (
  <div className={`${hover ? 'ds-card-hover' : 'ds-card'} ${padding ? 'p-5 sm:p-6' : ''} ${className}`}>
    {children}
  </div>
);

export default Card;
