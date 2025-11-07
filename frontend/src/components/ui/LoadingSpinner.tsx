"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  text?: string;
}

export function LoadingSpinner({
  size = "md",
  fullScreen = false,
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-8 w-8 border-2",
    md: "h-12 w-12 border-3",
    lg: "h-16 w-16 border-4",
  };

  const spinnerContent = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`animate-spin rounded-full border-t-transparent ${sizeClasses[size]}`}
        style={{ borderColor: "#6366F1", borderTopColor: "transparent" }}
      />
      {text && <p className="text-gray-600 text-sm animate-pulse">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-90 z-50">
        {spinnerContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinnerContent}
    </div>
  );
}

