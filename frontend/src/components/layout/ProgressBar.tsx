"use client";

interface ProgressBarProps {
  currentStep: number;
  steps: Array<{
    id: number;
    label: string;
    description: string;
  }>;
}

export function ProgressBar({ currentStep, steps }: ProgressBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center space-x-2 sm:space-x-4 md:space-x-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {/* Step Circle */}
              <div
                className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium ${
                  currentStep >= step.id
                    ? "text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
                style={{
                  backgroundColor:
                    currentStep >= step.id ? "#6366F1" : undefined,
                }}
              >
                {step.id}
              </div>

              {/* Step Label - 모바일에서 숨김 */}
              <div className="ml-1 sm:ml-3 hidden sm:block">
                <div
                  className={`text-xs sm:text-sm font-medium ${
                    currentStep >= step.id ? "text-gray-500" : "text-gray-500"
                  }`}
                  style={{
                    color: currentStep >= step.id ? "#6366F1" : undefined,
                  }}
                >
                  {step.label}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex items-center ml-2 sm:ml-4 md:ml-8">
                  <div
                    className={`w-4 sm:w-8 md:w-16 h-0.5 ${
                      currentStep > step.id ||
                      (currentStep === 1 && step.id === 1)
                        ? ""
                        : "bg-gray-200"
                    }`}
                    style={{
                      backgroundColor:
                        currentStep > step.id ||
                        (currentStep === 1 && step.id === 1)
                          ? "#6366F1"
                          : undefined,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
