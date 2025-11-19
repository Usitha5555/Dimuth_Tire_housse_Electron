interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner = ({ size = 'md', className = '' }: LoadingSpinnerProps) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`${className} flex items-center justify-center`}>
      <div
        className={`${sizes[size]} border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin`}
      />
    </div>
  );
};

export default LoadingSpinner;

