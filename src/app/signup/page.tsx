"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import GoogleAuthButton from '@/components/GoogleAuthButton';
import UniversitySearch from '@/components/UniversitySearch';
import OTPInput from '@/components/OTPInput';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function SignupPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        username: '',
        phone: '',
        email: '',
        university: '',
        role: 'buyer', // default
        password: '',
        confirmPassword: ''
    });
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const checkEmail = async () => {
        setError('');
        if (!formData.email) return setError('Email is required');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return setError('Please enter a valid email');

        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-email/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });
            if (!response.ok) throw new Error("Could not verify email");
            const data = await response.json();
            
            if (data.exists) {
                setStep(5); // Login step
            } else {
                // Send OTP
                const otpRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/send-otp/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.email })
                });
                if (!otpRes.ok) {
                    const otpErr = await otpRes.json().catch(() => ({}));
                    throw new Error(otpErr.detail || "Could not send OTP email");
                }
                setStep(1.5); // OTP step
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const verifyOTP = async () => {
        setError('');
        if (!otp || otp.length !== 6) return setError('Please enter a valid 6-digit OTP');

        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-otp/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email, otp })
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || "Invalid OTP");
            }
            setStep(2); // Proceed to username/phone step
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        setError('');
        if (step === 2) {
            if (!formData.username) return setError('Username is required');
            if (!formData.phone) return setError('Phone number is required');
        }
        if (step === 3) {
            if (!formData.role) return setError('Role is required');
        }
        setStep(prev => prev + 1);
    };

    const prevStep = () => {
        setError('');
        setStep(prev => (prev === 5 ? 1 : prev === 1.5 ? 1 : prev === 2 ? 1.5 : prev - 1));
    };

    const handleLoginSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/jwt/create/`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: formData.email, password: formData.password })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || "Login failed");
            }

            const data = await response.json();
            login(data);
            const next = new URLSearchParams(window.location.search).get('next');
            router.push(next || '/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        const payload = {
            username: formData.username,
            phone: formData.phone.startsWith('+234') ? formData.phone : `+234${formData.phone.replace(/^0+/, '')}`,
            email: formData.email,
            institute: formData.university,
            role: formData.role,
            password: formData.password
        };

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/`, {
                method: 'POST',
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                let msg = "Signup failed";
                if (errData.email) msg = errData.email[0];
                else if (errData.username) msg = errData.username[0];
                else if (errData.detail) msg = errData.detail;
                throw new Error(msg);
            }

            // Immediately log them in after signup
            await handleLoginSubmit();

        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    // Shared input style matching the premium glass aesthetic
    const inputClass = "w-full px-4 py-4 bg-transparent border border-gray-300 dark:border-zinc-700 rounded-xl text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-500 transition-all duration-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 hover:border-gray-400 dark:hover:border-zinc-600";
    const labelClass = "block text-[13px] font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2.5 ml-1";

    return (
        <div className="min-h-screen w-full flex bg-[#FDFDFD] dark:bg-[#0A0A0A] font-sans overflow-hidden">
            
            {/* Left Form Pane */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-20 relative overflow-y-auto z-10">
                <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                    
                    <Link href="/" className="relative flex items-center justify-start mb-8 h-12 sm:h-14 w-full overflow-hidden no-underline group">
                        <img src="/logo.png" alt="Kauchy" className="absolute left-[-10px] top-1/2 -translate-y-1/2 h-[180px] w-auto object-contain dark:hidden transition-transform duration-500 group-hover:scale-105" />
                        <img src="/darkmodelogo.png" alt="Kauchy" className="absolute left-[-10px] top-1/2 -translate-y-1/2 h-[180px] w-auto object-contain hidden dark:block transition-transform duration-500 group-hover:scale-105" />
                    </Link>

                    <div className="mb-10">
                        <h1 className="text-[2.2rem] leading-[1.2] font-serif tracking-tight text-gray-900 dark:text-white mb-3">
                            {step === 1 ? "Your business deserves more than \"DM to order.\" 👀" : step === 1.5 ? "Verify your email" : step === 2 ? "Who are you?" : step === 3 ? "Your details" : step === 5 ? "Welcome Back" : "Secure account"}
                        </h1>
                        <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
                            {step === 1 ? "Welcome to Kauchy. Scroll the feed, chat with friends, and trade securely." : step === 1.5 ? "We sent a 6-digit code to your email." : step === 4 ? "Almost there, set a strong password." : step === 5 ? "Enter your password to sign in." : "Tell us a bit more about yourself."}
                        </p>
                    </div>

                    <form onSubmit={step === 4 ? handleSignupSubmit : step === 5 ? handleLoginSubmit : (e) => { e.preventDefault(); if (step === 1) checkEmail(); else if (step === 1.5) verifyOTP(); else nextStep(); }} className="space-y-6">
                        
                        {/* Step 1: Email & Google */}
                        {step === 1 && (
                            <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
                                <div>
                                    <label className={labelClass}>Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="example@email.com"
                                        className={inputClass}
                                        autoFocus
                                    />
                                </div>

                                {error && <div className="text-sm font-medium text-red-500">{error}</div>}

                                <button type="button" onClick={checkEmail} className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg" disabled={loading}>
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-gray-900/30 dark:border-t-gray-900 rounded-full animate-spin"></span>
                                    ) : (
                                        <>Continue with email <ArrowRight size={18} /></>
                                    )}
                                </button>

                                <div className="flex items-center gap-4 py-2">
                                    <span className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                                    <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">or</span>
                                    <span className="flex-1 h-px bg-gray-200 dark:bg-zinc-800" />
                                </div>

                                <GoogleAuthButton next={typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null} />
                            </div>
                        )}

                        {/* Step 1.5: OTP Verification */}
                        {step === 1.5 && (
                            <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
                                <div>
                                    <label className={labelClass + " text-center"}>Enter OTP Code</label>
                                    <OTPInput 
                                        length={6} 
                                        value={otp} 
                                        onChange={(val) => { setOtp(val); setError(''); }} 
                                        disabled={loading}
                                    />
                                </div>

                                {error && <div className="text-sm font-medium text-red-500 text-center">{error}</div>}

                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={prevStep} className="flex items-center justify-center py-4 px-5 bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-colors hover:bg-gray-200 dark:hover:bg-zinc-800">
                                        <ArrowLeft size={20} />
                                    </button>
                                    <button type="button" onClick={verifyOTP} className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-base font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg" disabled={loading}>
                                        {loading ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-gray-900/30 dark:border-t-gray-900 rounded-full animate-spin"></span>
                                        ) : (
                                            <>Verify OTP <ArrowRight size={18} /></>
                                        )}
                                    </button>
                                </div>
                                <div className="text-center mt-4">
                                    <button type="button" onClick={checkEmail} className="text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium" disabled={loading}>
                                        Resend Code
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Username & Phone */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
                                <div>
                                    <label className={labelClass}>Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        placeholder="Choose a unique username"
                                        className={inputClass}
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Phone Number</label>
                                    <div className="relative flex items-center">
                                        <div className="absolute left-0 top-0 bottom-0 flex items-center px-4 border-r border-gray-300 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/50 rounded-l-xl pointer-events-none">
                                            <span className="mr-2 text-lg leading-none">🇳🇬</span>
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">+234</span>
                                        </div>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="Mobile number"
                                            className={inputClass + " pl-[110px]"}
                                        />
                                    </div>
                                </div>

                                {error && <div className="text-sm font-medium text-red-500">{error}</div>}

                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={prevStep} className="flex items-center justify-center py-4 px-5 bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-colors hover:bg-gray-200 dark:hover:bg-zinc-800">
                                        <ArrowLeft size={20} />
                                    </button>
                                    <button type="button" onClick={nextStep} className="flex-1 py-4 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-base font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5">
                                        Continue
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: University & Role */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
                                <div>
                                    <label className={labelClass}>University <span className="text-gray-400 dark:text-gray-500 normal-case tracking-normal ml-1">(Optional)</span></label>
                                    <UniversitySearch
                                        value={formData.university}
                                        onChange={(val) => { setFormData({ ...formData, university: val }); setError(''); }}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>What brings you here?</label>
                                    <div className="relative">
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className={`${inputClass} appearance-none`}
                                        >
                                            <option value="buyer" className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-white py-2">I want to buy things (Buyer)</option>
                                            <option value="vendor" className="bg-white dark:bg-zinc-900 text-gray-900 dark:text-white py-2">I want to sell things (Vendor)</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                            <svg className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {error && <div className="text-sm font-medium text-red-500">{error}</div>}

                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={prevStep} className="flex items-center justify-center py-4 px-5 bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-colors hover:bg-gray-200 dark:hover:bg-zinc-800">
                                        <ArrowLeft size={20} />
                                    </button>
                                    <button type="button" onClick={nextStep} className="flex-1 py-4 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-base font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5">
                                        Continue
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Password & Submit (Signup) */}
                        {step === 4 && (
                            <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
                                <div>
                                    <label className={labelClass}>Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Create a strong password"
                                            className={inputClass + " pr-20"}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-gray-500 dark:text-gray-400 text-xs font-bold tracking-wide px-2 py-1.5 rounded-md hover:text-gray-900 dark:hover:text-white"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? "HIDE" : "SHOW"}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Confirm Password</label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="Repeat password"
                                            className={inputClass + " pr-20"}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-gray-500 dark:text-gray-400 text-xs font-bold tracking-wide px-2 py-1.5 rounded-md hover:text-gray-900 dark:hover:text-white"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? "HIDE" : "SHOW"}
                                        </button>
                                    </div>
                                </div>

                                {error && <div className="text-sm font-medium text-red-500">{error}</div>}

                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={prevStep} className="flex items-center justify-center py-4 px-5 bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-colors hover:bg-gray-200 dark:hover:bg-zinc-800" disabled={loading}>
                                        <ArrowLeft size={20} />
                                    </button>
                                    <button type="submit" className="flex-1 py-4 px-6 bg-blue-600 text-white rounded-xl text-base font-semibold transition-all hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                Creating...
                                            </span>
                                        ) : "Create Account"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Password & Submit (Login) */}
                        {step === 5 && (
                            <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/50">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{formData.email}</span>
                                    <button type="button" onClick={() => { setStep(1); setFormData({...formData, password: ''}); }} className="text-xs font-bold text-blue-600 uppercase tracking-wide hover:underline">Change</button>
                                </div>
                                <div>
                                    <label className={labelClass}>Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            placeholder="Enter your password"
                                            className={inputClass + " pr-20"}
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-gray-500 dark:text-gray-400 text-xs font-bold tracking-wide px-2 py-1.5 rounded-md hover:text-gray-900 dark:hover:text-white"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? "HIDE" : "SHOW"}
                                        </button>
                                    </div>
                                </div>

                                {error && <div className="text-sm font-medium text-red-500">{error}</div>}

                                <button type="submit" className="w-full flex items-center justify-center py-4 px-6 bg-blue-600 text-white rounded-xl text-base font-semibold transition-all hover:bg-blue-700 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Signing in...
                                        </span>
                                    ) : "Sign In"}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>

            {/* Right Image Pane (Desktop Only) */}
            <div className="hidden lg:block lg:w-1/2 p-4 pl-0">
                <div className="w-full h-full relative rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl shadow-black/20">
                    <Image 
                        src="/signup-side-panel.png" 
                        alt="Join Kauchy" 
                        fill 
                        className="object-cover object-center transition-transform duration-[20s] hover:scale-105"
                        priority
                    />
                    {/* Subtle gradient overlay to ensure text/UI pop and add richness */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />
                </div>
            </div>
        </div>
    );
}
