import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { registerSchema, type RegisterFormData } from '@/types/forms';
import Button from '@/components/Button';
import Input from '@/components/Input';

const planOptions = [
  { value: 'galloway', label: 'Galloway (run/walk intervals)', description: 'Perfect for complete beginners' },
  { value: '15km', label: '15km Program', description: 'Build up to 15 kilometers' },
  { value: 'semi', label: 'Semi-marathon', description: '21.1km challenge' },
] as const;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      target_plan: 'galloway',
    },
  });

  const selectedPlan = watch('target_plan');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.email, data.password, data.weight, data.target_plan);
      navigate('/');
    } catch {
      // Error handled in store
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">NOVA COACH</h1>
          <p className="text-gray-600 mt-2">Start your running journey today</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card-hover p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create your account</h2>

          {/* Error banner */}
          {error && (
            <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg text-sm text-error-700" role="alert">
              {error}
              <button onClick={clearError} className="ml-2 underline">Dismiss</button>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                required
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
            </div>

            <Input
              label="Weight (kg)"
              type="number"
              placeholder="70"
              required
              hint="Used to personalize your training plan"
              error={errors.weight?.message}
              {...register('weight', { valueAsNumber: true })}
            />

            {/* Plan selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training Goal <span className="text-error-500" aria-hidden="true">*</span>
              </label>
              <div className="space-y-2">
                {planOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`
                      flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                      ${selectedPlan === option.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      className="mt-0.5 text-primary-600"
                      {...register('target_plan')}
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              {errors.target_plan && (
                <p className="mt-1 text-xs text-error-600">{errors.target_plan.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
