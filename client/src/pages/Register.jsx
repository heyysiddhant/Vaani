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
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#0B0F1A] text-white transition-colors">
      
      {/* Left Brand Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6D5CFF]/20 via-transparent to-[#F3B8FF]/20" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <img src={logo} alt="Vaani Logo" className="w-12 h-12 rounded-2xl shadow-xl object-cover" />
            <span className="text-xl font-black tracking-tight">Vaani</span>
          </div>

          <h1 className="text-5xl font-black leading-tight tracking-tight mb-6">
            Join the new <br /> social era.
          </h1>

          <p className="text-white/70 max-w-md text-lg">
            Create your space. Build your circle. Share your voice with the world.
          </p>
        </div>

        <div className="relative z-10 text-white/40 text-sm">
          © {new Date().getFullYear()} Vaani • Crafted for the world
        </div>
      </div>

      {/* Right Register Panel */}
      <div className="flex items-center justify-center px-4 sm:px-8">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">

          {/* Mobile Brand */}
          <div className="lg:hidden text-center">
            <img src={logo} alt="Vaani Logo" className="w-16 h-16 rounded-2xl shadow-xl object-cover mx-auto mb-4" />
            <h2 className="text-4xl font-black tracking-tight">Create your account</h2>
            <p className="text-white/60 mt-2 text-sm">
              Start your journey with Vaani
            </p>
          </div>

          {/* Glass Card */}
          <form
            onSubmit={handleSubmit}
            className="relative rounded-3xl p-8 sm:p-10 backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl"
          >
            <div className="space-y-5">
              <div>
                <label className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#6D5CFF] focus:ring-2 focus:ring-[#6D5CFF]/40 outline-none transition text-sm"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  className="mt-1 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#6D5CFF] focus:ring-2 focus:ring-[#6D5CFF]/40 outline-none transition text-sm"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[11px] font-black text-white/40 uppercase tracking-widest ml-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  className="mt-1 w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-[#6D5CFF] focus:ring-2 focus:ring-[#6D5CFF]/40 outline-none transition text-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-8 w-full py-3 rounded-xl font-black tracking-wide bg-gradient-to-r from-[#6D5CFF] to-[#8F6CFF] hover:shadow-xl hover:shadow-[#6D5CFF]/30 transition active:scale-[0.98]"
            >
              Create Account
            </button>

            <p className="mt-6 text-center text-sm text-white/60">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[#8F6CFF] font-bold hover:underline"
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