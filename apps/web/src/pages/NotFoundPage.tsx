import { Link } from 'react-router-dom';
import Button from '@/components/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🏃</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-3">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          Looks like this page took a wrong turn on its run. Let&apos;s get you back on track!
        </p>
        <Link to="/">
          <Button size="lg">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
