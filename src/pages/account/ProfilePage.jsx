// src/pages/ProfilePage.jsx ← FINAL: ADDRESS COUNTRY CHANGEABLE + LUXURY
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Camera, Save, User, AtSign, Mail, Calendar, MapPin, ChevronDown } from 'lucide-react';
import Grainient from '@/components/effects/Grainient';
import Particles from '@/components/effects/Particles';

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

const FIELD_LABEL_CLASS = 'mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-artisan-text-muted';
const FIELD_INPUT_CLASS = 'w-full rounded-xl border border-artisan-border bg-white px-4 py-3 text-base text-artisan-text shadow-sm outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-artisan-text-faint focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15';
const FIELD_VALUE_CLASS = 'min-h-12 rounded-xl border border-artisan-primary/10 bg-artisan-primary-wash/35 px-4 py-3 text-base font-semibold text-artisan-text';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    phoneCountry: ALL_COUNTRIES[0],
    birthdate: '',
    photoURL: '',
    address: {
      street: '',
      city: '',
      stateProvince: '',
      postalCode: '',
      country: '',
      countryObj: ALL_COUNTRIES[0]
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState({});
  const [isPhoneCountryOpen, setIsPhoneCountryOpen] = useState(false);
  const [isAddressCountryOpen, setIsAddressCountryOpen] = useState(false);
  const [phoneCountrySearch, setPhoneCountrySearch] = useState("");
  const [addressCountrySearch, setAddressCountrySearch] = useState("");
  const fileInputRef = useRef(null);

  const [countries] = useState(ALL_COUNTRIES);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const addr = data.addresses?.[0] || {};

        // Parse phone
        let phoneCountry = ALL_COUNTRIES[0];
        let phoneNumber = data.phone || '';
        if (phoneNumber) {
          const match = phoneNumber.match(/^(\+\d+)\s*(.*)$/);
          if (match) {
            const code = match[1];
            phoneCountry = countries.find(c => c.callingCode === code) || ALL_COUNTRIES[0];
            phoneNumber = match[2];
          }
        }

        // Parse address country
        let addressCountryObj = ALL_COUNTRIES[0];
        if (addr.country) {
          addressCountryObj = countries.find(c => c.name === addr.country) || ALL_COUNTRIES[0];
        }

        const loadedProfile = {
          username: data.username || 'Not set',
          fullName: data.fullName || data.displayName || user.email.split('@')[0],
          email: user.email,
          phone: phoneNumber,
          phoneCountry,
          birthdate: data.birthdate || 'Not set',
          photoURL: data.photoURL || '',
          address: {
            street: addr.street || '',
            city: addr.city || '',
            stateProvince: addr.stateProvince || '',
            postalCode: addr.postalCode || '',
            country: addr.country || 'Not set',
            countryObj: addressCountryObj
          }
        };

        setProfile(loadedProfile);
        setTempData({
          username: data.username || '',
          fullName: data.fullName || data.displayName || user.email.split('@')[0],
          phone: phoneNumber,
          birthdate: data.birthdate || '',
          street: addr.street || '',
          city: addr.city || '',
          stateProvince: addr.stateProvince || '',
          postalCode: addr.postalCode || '',
        });
      }
    });

    return () => unsub();
  }, [user]);

  const filteredPhoneCountries = countries.filter(country =>
    country.name.toLowerCase().includes(phoneCountrySearch.toLowerCase()) ||
    country.callingCode.includes(phoneCountrySearch)
  );

  const filteredAddressCountries = countries.filter(country =>
    country.name.toLowerCase().includes(addressCountrySearch.toLowerCase())
  );

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "dabs-co-unsigned");

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: data.secure_url
      });
    } catch (err) {
      alert("Failed to upload photo");
    }
  };

  const handleSave = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        username: tempData.username.toLowerCase().trim(),
        fullName: tempData.fullName.trim(),
        displayName: tempData.fullName.trim(),
        phone: profile.phoneCountry.callingCode + " " + tempData.phone,
        birthdate: tempData.birthdate,
        addresses: [{
          street: tempData.street,
          city: tempData.city,
          stateProvince: tempData.stateProvince,
          postalCode: tempData.postalCode,
          country: profile.address.countryObj.name,
          isDefault: true
        }]
      });
      setIsEditing(false);
      alert("Profile updated!");
    } catch (err) {
      alert("Failed to save profile");
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5" style={{ background: 'var(--artisan-gradient-bg)' }}>
        <p className="rounded-2xl border border-white/60 bg-white/95 px-6 py-5 text-center text-xl font-semibold text-artisan-text shadow-xl shadow-[#2D0E5A]/15">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>@{profile.username} - Profile</title></Helmet>

      <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--artisan-gradient-bg)' }}>
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ isolation: 'isolate' }}>
          <Grainient
            color1="#5C2D91"
            color2="#7B3FA0"
            color3="#C9A0DC"
            timeSpeed={0.25}
            colorBalance={-0.06}
            warpStrength={1.5}
            warpFrequency={3.8}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={1}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.1}
            grainScale={2}
            grainAnimated={false}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />

          <div className="absolute inset-0 pointer-events-none">
            <Particles
              particleCount={180}
              particleSpread={10}
              speed={0.1}
              particleColors={['#FAF8FF', '#E8D8F3', '#C9A0DC']}
              moveParticlesOnHover
              particleHoverFactor={1}
              alphaParticles={false}
              particleBaseSize={120}
              sizeRandomness={1.4}
              cameraDistance={53}
              disableRotation={false}
            />
          </div>
        </div>

        <div className="relative z-10 container mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="overflow-hidden rounded-[2rem] border border-white/50 bg-white/95 shadow-2xl shadow-[#2D0E5A]/20 backdrop-blur-md"
          >
            {/* Profile Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-[#2D0E5A] via-artisan-primary to-artisan-primary-mid px-6 py-10 text-white sm:px-10 md:px-14 md:py-14">
              <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-artisan-primary-pale/30 blur-3xl" />
              <div className="relative flex flex-col items-center gap-7 md:flex-row md:gap-10">
              <div className="relative">
                <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white/75 bg-artisan-primary-wash shadow-2xl sm:h-40 sm:w-40">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User size={64} className="text-artisan-primary" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  aria-label="Upload a new profile photo"
                  className="absolute -bottom-1 -right-1 rounded-full border-2 border-white bg-artisan-primary-pale p-3 text-artisan-text shadow-lg transition-[transform,background-color] duration-200 hover:scale-105 hover:bg-white"
                >
                  <Camera size={20} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="text-center md:text-left">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-artisan-primary-pale">My profile</p>
                <h1 className="font-artisan-display text-4xl font-bold sm:text-5xl">
                  @{profile.username}
                </h1>
                <p className="mt-2 text-xl font-semibold text-white/90 sm:text-2xl">{profile.fullName}</p>
                <p className="mt-5 flex items-center justify-center gap-2 text-sm text-white/80 md:justify-start sm:text-base">
                  <Mail size={18} /> {profile.email}
                </p>
              </div>
            </div>
            </div>

            {/* Profile Info */}
            <div className="space-y-10 p-6 sm:p-10 md:p-14">
              {/* Personal Info */}
              <section>
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Account details</p>
                    <h2 className="mt-1 font-artisan-display text-3xl font-bold text-artisan-text">Personal information</h2>
                  </div>
                  {!isEditing && <p className="text-sm text-artisan-text-muted">Select Edit Profile to update your details.</p>}
                </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                <div>
                  <label className={FIELD_LABEL_CLASS}>
                    <AtSign size={18} /> Username
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempData.username}
                      onChange={(e) => setTempData({...tempData, username: e.target.value})}
                      className={FIELD_INPUT_CLASS}
                      placeholder="juandelacruz123"
                    />
                  ) : (
                    <p className={FIELD_VALUE_CLASS}>@{profile.username}</p>
                  )}
                </div>

                <div>
                  <label className={FIELD_LABEL_CLASS}>
                    <User size={18} /> Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempData.fullName}
                      onChange={(e) => setTempData({...tempData, fullName: e.target.value})}
                      className={FIELD_INPUT_CLASS}
                    />
                  ) : (
                    <p className={FIELD_VALUE_CLASS}>{profile.fullName}</p>
                  )}
                </div>

                {/* PHONE WITH COUNTRY SELECTOR */}
                <div>
                  <label className={FIELD_LABEL_CLASS}>Phone Number</label>
                  {isEditing ? (
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsPhoneCountryOpen(!isPhoneCountryOpen)}
                          className="flex h-12 w-full items-center gap-2 rounded-xl border border-artisan-border bg-white px-3 text-artisan-text shadow-sm transition-[border-color] duration-200 hover:border-artisan-primary sm:w-auto"
                        >
                          <img src={profile.phoneCountry?.flag || ALL_COUNTRIES[0].flag} alt="" className="h-5 w-7 rounded" />
                          <span className="font-medium">{profile.phoneCountry?.callingCode || "+63"}</span>
                          <ChevronDown size={20} />
                        </button>

                        {isPhoneCountryOpen && (
                          <div className="absolute top-full z-50 mt-2 max-h-96 w-[min(24rem,calc(100vw-3rem))] overflow-y-auto rounded-2xl border border-artisan-border bg-white shadow-2xl">
                            <div className="border-b border-artisan-primary/10 p-4">
                              <input
                                type="text"
                                placeholder="Search country..."
                                value={phoneCountrySearch}
                                onChange={(e) => setPhoneCountrySearch(e.target.value)}
                                className={FIELD_INPUT_CLASS}
                                autoFocus
                              />
                            </div>
                            {filteredPhoneCountries.map(country => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setProfile(prev => ({ ...prev, phoneCountry: country }));
                                  setIsPhoneCountryOpen(false);
                                  setPhoneCountrySearch("");
                                }}
                                className="flex w-full items-center gap-4 px-5 py-3 text-left text-artisan-text transition-colors duration-200 hover:bg-artisan-primary-wash"
                              >
                                <img src={country.flag} alt="" className="w-10 h-7 rounded" />
                                <span className="flex-1">{country.name}</span>
                                <span className="text-artisan-text-muted">{country.callingCode}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <input
                        type="text"
                        value={tempData.phone}
                        onChange={(e) => setTempData({...tempData, phone: e.target.value})}
                        className={`flex-1 ${FIELD_INPUT_CLASS}`}
                        placeholder="912 345 6789"
                      />
                    </div>
                  ) : (
                    <p className={`${FIELD_VALUE_CLASS} flex items-center gap-3`}>
                      <img src={profile.phoneCountry?.flag || ALL_COUNTRIES[0].flag} alt="" className="h-6 w-8 rounded" />
                      {profile.phoneCountry?.callingCode || "+63"} {profile.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className={FIELD_LABEL_CLASS}>
                    <Calendar size={18} /> Birthdate
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={tempData.birthdate}
                      onChange={(e) => setTempData({...tempData, birthdate: e.target.value})}
                      className={FIELD_INPUT_CLASS}
                    />
                  ) : (
                    <p className={FIELD_VALUE_CLASS}>{profile.birthdate || "Not set"}</p>
                  )}
                </div>
              </div>
              </section>

              {/* Shipping Address */}
              <section className="rounded-[1.5rem] border border-artisan-primary/10 bg-artisan-primary-wash/35 p-5 sm:p-7 md:p-8">
                <div className="mb-7 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-artisan-primary text-white shadow-artisan-sm">
                    <MapPin size={21} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Delivery details</p>
                    <h2 className="font-artisan-display text-3xl font-bold text-artisan-text">Address</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                  <div>
                    <label className={FIELD_LABEL_CLASS}>Street Address</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={tempData.street}
                        onChange={(e) => setTempData({...tempData, street: e.target.value})}
                        className={FIELD_INPUT_CLASS}
                        placeholder="123 Sampaguita St"
                      />
                    ) : (
                      <p className={FIELD_VALUE_CLASS}>{profile.address.street || "Not set"}</p>
                    )}
                  </div>

                  <div>
                    <label className={FIELD_LABEL_CLASS}>City</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={tempData.city}
                        onChange={(e) => setTempData({...tempData, city: e.target.value})}
                        className={FIELD_INPUT_CLASS}
                      />
                    ) : (
                      <p className={FIELD_VALUE_CLASS}>{profile.address.city || "Not set"}</p>
                    )}
                  </div>

                  <div>
                    <label className={FIELD_LABEL_CLASS}>State / Province</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={tempData.stateProvince}
                        onChange={(e) => setTempData({...tempData, stateProvince: e.target.value})}
                        className={FIELD_INPUT_CLASS}
                      />
                    ) : (
                      <p className={FIELD_VALUE_CLASS}>{profile.address.stateProvince || "Not set"}</p>
                    )}
                  </div>

                  <div>
                    <label className={FIELD_LABEL_CLASS}>Postal / ZIP Code</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={tempData.postalCode}
                        onChange={(e) => setTempData({...tempData, postalCode: e.target.value})}
                        className={FIELD_INPUT_CLASS}
                      />
                    ) : (
                      <p className={FIELD_VALUE_CLASS}>{profile.address.postalCode || "Not set"}</p>
                    )}
                  </div>

                  {/* COUNTRY SELECTOR FOR ADDRESS */}
                  <div className="md:col-span-2">
                    <label className={FIELD_LABEL_CLASS}>Country</label>
                    {isEditing ? (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsAddressCountryOpen(!isAddressCountryOpen)}
                          className="flex w-full items-center justify-between rounded-xl border border-artisan-border bg-white px-4 py-3 text-left text-artisan-text shadow-sm transition-[border-color] duration-200 hover:border-artisan-primary"
                        >
                          <div className="flex items-center gap-3">
                            <img src={profile.address.countryObj.flag} alt="" className="h-6 w-9 rounded" />
                            <span className="font-medium">{profile.address.countryObj.name}</span>
                          </div>
                          <ChevronDown size={20} />
                        </button>

                        {isAddressCountryOpen && (
                          <div className="absolute top-full z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-2xl border border-artisan-border bg-white shadow-2xl">
                            <div className="border-b border-artisan-primary/10 p-4">
                              <input
                                type="text"
                                placeholder="Search country..."
                                value={addressCountrySearch}
                                onChange={(e) => setAddressCountrySearch(e.target.value)}
                                className={FIELD_INPUT_CLASS}
                                autoFocus
                              />
                            </div>
                            {filteredAddressCountries.map(country => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setProfile(prev => ({ ...prev, address: { ...prev.address, countryObj: country } }));
                                  setIsAddressCountryOpen(false);
                                  setAddressCountrySearch("");
                                }}
                                className="flex w-full items-center gap-4 px-5 py-3 text-left text-artisan-text transition-colors duration-200 hover:bg-artisan-primary-wash"
                              >
                                <img src={country.flag} alt="" className="w-10 h-7 rounded" />
                                <span>{country.name}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`${FIELD_VALUE_CLASS} flex items-center gap-3`}>
                        <img src={profile.address.countryObj.flag} alt="" className="h-6 w-9 rounded shadow-sm" />
                        <p>{profile.address.country}</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Edit Button */}
              <div className="flex flex-col gap-4 border-t border-artisan-primary/10 pt-8 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <div>
                  <p className="font-semibold text-artisan-text">{isEditing ? 'Review your changes before saving.' : 'Keep your delivery details up to date.'}</p>
                  <p className="mt-1 text-sm text-artisan-text-muted">Your profile information is saved securely to your account.</p>
                </div>
                {isEditing ? (
                  <div className="flex flex-col-reverse justify-center gap-3 sm:flex-row">
                    <Button onClick={handleSave} size="lg" className="w-full sm:w-auto">
                      <Save className="mr-2" size={19} /> Save Changes
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => setIsEditing(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button size="lg" onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
