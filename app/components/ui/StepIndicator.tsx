
export interface Step {
  name: string;
  status: 'complete' | 'current' | 'upcoming';
}

interface StepIndicatorProps {
  steps: Step[];
  onStepClick?: (index: number) => void;
}

export default function StepIndicator({ steps, onStepClick }: StepIndicatorProps) {
  const currentStepIndex = steps.findIndex((step) => step.status === 'current');
  
  return (
    <nav aria-label="Progress" className="flex items-center justify-center">
      <p className="text-sm font-medium text-gray-900">
        Step {currentStepIndex + 1} of {steps.length}
      </p>
      <ol role="list" className="ml-8 flex items-center space-x-5">
        {steps.map((step, index) => (
          <li key={step.name}>
            {step.status === 'complete' ? (
              <button
                type="button"
                onClick={() => onStepClick?.(index)}
                className="block size-2.5 rounded-full bg-indigo-600 hover:bg-indigo-900 transition-colors"
                aria-label={`Go to ${step.name}`}
              >
                <span className="sr-only">{step.name}</span>
              </button>
            ) : step.status === 'current' ? (
              <div aria-current="step" className="relative flex items-center justify-center">
                <span aria-hidden="true" className="absolute flex size-5 p-px">
                  <span className="size-full rounded-full bg-indigo-200" />
                </span>
                <span aria-hidden="true" className="relative block size-2.5 rounded-full bg-indigo-600" />
                <span className="sr-only">{step.name}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onStepClick?.(index)}
                disabled={!onStepClick}
                className="block size-2.5 rounded-full bg-gray-200 hover:bg-gray-400 disabled:hover:bg-gray-200 transition-colors"
                aria-label={`Go to ${step.name}`}
              >
                <span className="sr-only">{step.name}</span>
              </button>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}