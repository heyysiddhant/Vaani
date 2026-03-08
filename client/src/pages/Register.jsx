import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import logo from '../assets/vaani.png';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate('/dashboard');
      toast.success('Registered successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gray-950 text-white transition-colors relative selection:bg-primary-500/30">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      {/* Left Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative z-10 overflow-hidden border-r border-white/5 bg-gray-900/40 backdrop-blur-3xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16 animate-in slide-in-from-top-6 fade-in duration-1000">
            <div className="p-3 bg-white/5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
                <img src={logo} alt="Vaani Logo" className="w-10 h-10 object-cover" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-gradient">Vaani</span>
          </div>

          <h1 className="text-5xl font-black leading-[1.1] tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 animate-in slide-in-from-left-8 fade-in duration-1000 delay-150">
            Join the new <br /> social era.
          </h1>

          <p className="text-gray-400 max-w-md text-lg leading-relaxed font-medium animate-in slide-in-from-left-8 fade-in duration-1000 delay-300">
            Create your space. Build your circle. Share your voice with the world flawlessly.
          </p>
        </div>

        <div className="relative z-10 text-gray-500 text-sm font-medium tracking-wide animate-in fade-in duration-1000 delay-500">
          © {new Date().getFullYear()} Vaani • Designed for the future
        </div>
      </div>

      {/* Right Register Panel */}
      <div className="flex items-center justify-center px-4 sm:px-12 lg:px-24 relative z-10">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">

          {/* Mobile Brand */}
          <div className="lg:hidden text-center mb-8">
            <div className="mx-auto w-16 h-16 p-3 bg-white/5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md mb-6 inline-flex items-center justify-center">
                <img src={logo} alt="Vaani Logo" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60">Welcome</h2>
            <p className="text-gray-400 mt-2 text-sm font-medium">
              Create your account to continue
            </p>
          </div>

          {/* Glass Card */}
          <form
            onSubmit={handleSubmit}
            className="relative rounded-[2rem] p-8 sm:p-10 bg-gray-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50"
          >
            <div className="space-y-5">
              <div className="group">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-1.5 block group-focus-within:text-primary-400 transition-colors">
                  Full Name
                </label>
                <div className="relative">
                    <input
                    type="text"
                    required
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-950/50 border border-white/5 focus:border-primary-500/50 focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-sm font-medium text-white placeholder-gray-600"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    />
                </div>
              </div>

              <div className="group">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-1.5 block group-focus-within:text-primary-400 transition-colors">
                  Email Address
                </label>
                <div className="relative">
                    <input
                    type="email"
                    required
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-950/50 border border-white/5 focus:border-primary-500/50 focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-sm font-medium text-white placeholder-gray-600"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
              </div>

              <div className="group">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-1.5 block group-focus-within:text-primary-400 transition-colors">
                  Password
                </label>
                <div className="relative">
                    <input
                    type="password"
                    required
                    className="w-full px-5 py-3.5 rounded-2xl bg-gray-950/50 border border-white/5 focus:border-primary-500/50 focus:bg-gray-900 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-sm font-medium text-white placeholder-gray-600"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-8 w-full py-4 rounded-2xl font-black tracking-wide text-sm bg-gradient-to-br from-primary-500 to-indigo-600 hover:from-primary-400 hover:to-indigo-500 text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all active:scale-[0.98] border border-white/10"
            >
              Create Account
            </button>

            <p className="mt-8 text-center text-sm font-medium text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary-400 hover:text-primary-300 font-bold hover:underline underline-offset-4 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;