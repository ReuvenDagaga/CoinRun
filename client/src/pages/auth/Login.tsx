import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth, useUser } from '@/context';
import { authenticateWithGoogle } from '@/services/auth.service';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { initializeUserData } = useUser();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError('');
    setIsLoading(true);

    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }

      // Send credential to backend for verification and user creation/retrieval
      const response = await authenticateWithGoogle(credentialResponse.credential);

      // Store auth user info with token
      login({
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
      }, response.token);

      // Store user game data
      initializeUserData(response.userData);

      // Navigate to home
      navigate('/');
    } catch (err) {
      console.error('Google login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login was cancelled or failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2" style={{
            fontFamily: '"Comic Sans MS", "Bangers", sans-serif',
            textShadow: '3px 3px 0 #FF6B35, -1px -1px 0 #000'
          }}>
            🏃 COIN RUN
          </h1>
          <p className="text-white/90 text-lg">Run, Collect, Conquer!</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Sign in to Continue
          </h2>

          <div className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-4">
                <p className="text-red-200 text-sm text-center">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="ml-3 text-white">Logging you in...</span>
              </div>
            ) : (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                  size="large"
                  text="continue_with"
                  shape="pill"
                  theme="filled_blue"
                  width="300"
                />
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-white/70 text-sm text-center">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Info Notice */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
          <p className="text-white/80 text-sm text-center">
            <span className="font-semibold">🔐 Secure Login:</span> We use Google OAuth for secure authentication. Your credentials are never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
