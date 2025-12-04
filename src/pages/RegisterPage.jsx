// src/pages/RegisterPage.jsx ← FINAL: BUYER CAN TYPE COUNTRY + FULL ADDRESS
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Mail, Lock, User, Calendar, ChevronDown, AtSign, Home, MapPin } from 'lucide-react';

// ALL COUNTRIES
const ALL_COUNTRIES = [
  { name: "Philippines", code: "PH", flag: "https://flagcdn.com/ph.svg", callingCode: "+63" },
  { name: "United States", code: "US", flag: "https://flagcdn.com/us.svg", callingCode: "+1" },
  { name: "United Kingdom", code: "GB", flag: "https://flagcdn.com/gb.svg", callingCode: "+44" },
  { name: "Canada", code: "CA", flag: "https://flagcdn.com/ca.svg", callingCode: "+1" },
  { name: "Australia", code: "AU", flag: "https://flagcdn.com/au.svg", callingCode: "+61" },
  { name: "Germany", code: "DE", flag: "https://flagcdn.com/de.svg", callingCode: "+49" },
  { name: "France", code: "FR", flag: "https://flagcdn.com/fr.svg", callingCode: "+33" },
  { name: "Japan", code: "JP", flag: "https://flagcdn.com/jp.svg", callingCode: "+81" },
  { name: "Singapore", code: "SG", flag: "https://flagcdn.com/sg.svg", callingCode: "+65" },
  { name: "South Korea", code: "KR", flag: "https://flagcdn.com/kr.svg", callingCode: "+82" },
  { name: "India", code: "IN", flag: "https://flagcdn.com/in.svg", callingCode: "+91" },
  { name: "Malaysia", code: "MY", flag: "https://flagcdn.com/my.svg", callingCode: "+60" },
  { name: "Thailand", code: "TH", flag: "https://flagcdn.com/th.svg", callingCode: "+66" },
  { name: "Indonesia", code: "ID", flag: "https://flagcdn.com/id.svg", callingCode: "+62" },
  { name: "Vietnam", code: "VN", flag: "https://flagcdn.com/vn.svg", callingCode: "+84" },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [countries] = useState(ALL_COUNTRIES);
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState(ALL_COUNTRIES[0]);
  const [selectedAddressCountry, setSelectedAddressCountry] = useState(ALL_COUNTRIES[0]);
  const [isPhoneCountryOpen, setIsPhoneCountryOpen] = useState(false);
  const [isAddressCountryOpen, setIsAddressCountryOpen] = useState(false);
  const [phoneCountrySearch, setPhoneCountrySearch] = useState("");
  const [addressCountrySearch, setAddressCountrySearch] = useState("");

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    streetAddress: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    password: '',
    confirmPassword: '',
    birthdate: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredPhoneCountries = countries.filter(country =>
    country.name.toLowerCase().includes(phoneCountrySearch.toLowerCase()) ||
    country.callingCode.includes(phoneCountrySearch)
  );

  const filteredAddressCountries = countries.filter(country =>
    country.name.toLowerCase().includes(addressCountrySearch.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    if (!formData.username.trim()) {
      setError("Username is required");
      setLoading(false);
      return;
    }
    if (formData.username.includes(' ')) {
      setError("Username cannot contain spaces");
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const newUser = userCredential.user;

      await setDoc(doc(db, "users", newUser.uid), {
        fullName: formData.fullName.trim(),
        username: formData.username.toLowerCase().trim(),
        email: newUser.email,
        phone: selectedPhoneCountry.callingCode + " " + formData.phone,
        birthdate: formData.birthdate,
        displayName: formData.fullName.trim(),
        role: "customer",
        createdAt: new Date(),
        photoURL: "",
        addresses: [
          {
            street: formData.streetAddress,
            city: formData.city,
            stateProvince: formData.stateProvince,
            postalCode: formData.postalCode,
            country: selectedAddressCountry.name,  // ← NOW SAVED FROM ADDRESS COUNTRY SELECTOR
            isDefault: true
          }
        ]
      });

      navigate('/buyer-dashboard');
    } catch (err) {
      setError(err.message.includes("email-already-in-use") 
        ? "Email already registered" 
        : "Registration failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    navigate('/buyer-dashboard');
    return null;
  }

  return (
    <>
      <Helmet><title>Register - D.A.B.S. Co.</title></Helmet>

      <div className="container mx-auto px-4 py-12 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="bg-[#118C8C] p-12 text-center">
            <h1 className="text-5xl font-bold text-white mb-4">Join D.A.B.S. Co.</h1>
            <p className="text-2xl text-[#bcecec]">Create your account and start shopping</p>
          </div>

          <div className="p-12">
            {error && (
              <div className="mb-8 p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center text-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-lg font-medium text-gray-700 flex items-center gap-3">
                    <User size={20} /> Full Name
                  </label>
                  <input
                    name="fullName"
                    type="text"
                    required
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-[#118C8C] transition"
                    placeholder="Juan Dela Cruz"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-lg font-medium text-gray-700 flex items-center gap-3">
                    <AtSign size={20} /> Username
                  </label>
                  <input
                    name="username"
                    type="text"
                    required
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-[#118C8C] transition"
                    placeholder="juandelacruz"
                    value={formData.username}
                    onChange={handleChange}
                  />
                  <p className="text-sm text-gray-500">No spaces • lowercase only</p>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-lg font-medium text-gray-700 flex items-center gap-3">
                  <Mail size={20} /> Email Address
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-[#118C8C] transition"
                  placeholder="juan@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* Phone + Country */}
              <div className="space-y-2">
                <label className="text-lg font-medium text-gray-700">Phone Number</label>
                <div className="flex gap-4">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsPhoneCountryOpen(!isPhoneCountryOpen)}
                      className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition"
                    >
                      <img src={selectedPhoneCountry.flag} alt="" className="w-8 h-6 rounded" />
                      <span className="font-medium">{selectedPhoneCountry.callingCode}</span>
                      <ChevronDown size={20} />
                    </button>

                    {isPhoneCountryOpen && (
                      <div className="absolute top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                        <div className="p-4 border-b">
                          <input
                            type="text"
                            placeholder="Search country..."
                            value={phoneCountrySearch}
                            onChange={(e) => setPhoneCountrySearch(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg"
                            autoFocus
                          />
                        </div>
                        {filteredPhoneCountries.map(country => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSelectedPhoneCountry(country);
                              setIsPhoneCountryOpen(false);
                              setPhoneCountrySearch("");
                            }}
                            className="w-full text-left px-5 py-4 hover:bg-gray-50 flex items-center gap-4"
                          >
                            <img src={country.flag} alt="" className="w-10 h-7 rounded" />
                            <span className="flex-1">{country.name}</span>
                            <span className="text-gray-500">{country.callingCode}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <input
                    name="phone"
                    type="tel"
                    required
                    className="flex-1 px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-[#118C8C] transition"
                    placeholder="912 345 6789"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-6 pt-8 border-t-2 border-gray-200">
                <h3 className="text-2xl font-bold text-[#118C8C] flex items-center gap-3">
                  <Home size={28} /> Shipping Address
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <input
                    name="streetAddress"
                    type="text"
                    required
                    placeholder="Street Address"
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-[#118C8C] transition"
                    value={formData.streetAddress}
                    onChange={handleChange}
                  />
                  <input
                    name="city"
                    type="text"
                    required
                    placeholder="City"
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-[#118C8C] transition"
                    value={formData.city}
                    onChange={handleChange}
                  />
                  <input
                    name="stateProvince"
                    type="text"
                    required
                    placeholder="State / Province"
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-[#118C8C] transition"
                    value={formData.stateProvince}
                    onChange={handleChange}
                  />
                  <input
                    name="postalCode"
                    type="text"
                    required
                    placeholder="Postal / ZIP Code"
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-[#118C8C] transition"
                    value={formData.postalCode}
                    onChange={handleChange}
                  />
                </div>

                {/* COUNTRY SELECTOR FOR ADDRESS */}
                <div className="space-y-2">
                  <label className="text-lg font-medium text-gray-700">Country</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAddressCountryOpen(!isAddressCountryOpen)}
                      className="w-full flex items-center justify-between px-6 py-5 bg-gray-50 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition text-left"
                    >
                      <div className="flex items-center gap-4">
                        <img src={selectedAddressCountry.flag} alt="" className="w-10 h-7 rounded" />
                        <span className="font-medium">{selectedAddressCountry.name}</span>
                      </div>
                      <ChevronDown size={20} />
                    </button>

                    {isAddressCountryOpen && (
                      <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                        <div className="p-4 border-b">
                          <input
                            type="text"
                            placeholder="Search country..."
                            value={addressCountrySearch}
                            onChange={(e) => setAddressCountrySearch(e.target.value)}
                            className="w-full px-4 py-3 border rounded-lg"
                            autoFocus
                          />
                        </div>
                        {filteredAddressCountries.map(country => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSelectedAddressCountry(country);
                              setIsAddressCountryOpen(false);
                              setAddressCountrySearch("");
                            }}
                            className="w-full text-left px-6 py-4 hover:bg-gray-50 flex items-center gap-4"
                          >
                            <img src={country.flag} alt="" className="w-10 h-7 rounded" />
                            <span>{country.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Birthdate */}
              <div className="space-y-2">
                <label className="text-lg font-medium text-gray-700 flex items-center gap-3">
                  <Calendar size={20} /> Birthdate
                </label>
                <input
                  name="birthdate"
                  type="date"
                  required
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-[#118C8C] transition"
                  value={formData.birthdate}
                  onChange={handleChange}
                />
              </div>

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-lg font-medium text-gray-700 flex items-center gap-3">
                    <Lock size={20} /> Password
                  </label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength="6"
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-[#118C8C] transition"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-lg font-medium text-gray-700 flex items-center gap-3">
                    <Lock size={20} /> Confirm Password
                  </label>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-[#118C8C] transition"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-[#F2BB16] hover:bg-[#d9a614] text-gray-900 font-bold py-5 text-2xl" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-10 text-center">
              <p className="text-gray-600 text-lg">
                Already have an account?{' '}
                <Link to="/login" className="text-[#118C8C] font-bold hover:underline text-xl">
                  Log In
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default RegisterPage;