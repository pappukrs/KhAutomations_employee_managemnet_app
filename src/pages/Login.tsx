import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Lottie from 'lottie-react';
import securityAnimation from '../../public/animation/cctv.json';
import loginAnimation from '../../public/animation/cctv-login.json';

export default function Login() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(mobile, password);
      toast.success('Successfully logged in!');
      navigate('/employee');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log in. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      {/* Left side */}
      <div className="hidden lg:flex flex-col items-center justify-center w-full max-w-md mx-4">
        <div className="w-full">
          <Lottie animationData={securityAnimation} loop className="w-full h-auto" />
          <h2 className="text-3xl font-bold text-center text-gray-800 mt-8">
            Secure CCTV Monitoring Solutions
          </h2>
          <p className="text-center text-gray-600 mt-4">
            Professional security systems for your peace of mind
          </p>
        </div>
      </div>

      {/* Right side (Login Form) */}
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md mx-4">
        <div className="flex items-center justify-center mb-8">
          <Lottie animationData={loginAnimation} loop className="w-1/2 h-auto" />
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">KHAutomations</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mobile Number Input */}
          <div>
            <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
              Mobile Number
            </label>
            <input
              id="mobile"
              type="tel"
              required
              pattern="[0-9]{10}"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your 10-digit mobile number"
            />
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-800 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
