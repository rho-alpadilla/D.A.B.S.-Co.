// src/pages/ProfilePage.jsx ← FINAL: ADDRESS COUNTRY CHANGEABLE + LUXURY
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { deleteUser, signOut } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { ClearSearchButton } from '@/components/ui/clear-search-button';
import { Camera, Save, User, AtSign, Mail, Calendar, MapPin, ChevronDown, Edit, Phone } from 'lucide-react';
import AccountDangerZone from '@/components/account/AccountDangerZone';
import {
  getAccountLifecycleErrorMessage,
  getAccountPurchaseSummary,
  reauthenticateAccount,
  removeEligibleAccountData,
} from '@/lib/accountLifecycle';
import { useUserRole } from '@/hooks/useUserRole';
import { DEFAULT_PICKUP_SETTINGS, normalizePickupSettings } from '@/lib/storefrontSettings';

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

const FIELD_LABEL_CLASS = 'mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.04em] text-artisan-text-muted';
const FIELD_INPUT_CLASS = 'w-full rounded-xl border border-artisan-border bg-white px-4 py-3 text-base text-artisan-text shadow-sm outline-none transition-[border-color,box-shadow,transform] duration-200 placeholder:text-artisan-text-faint focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15';
const FIELD_VALUE_CLASS = 'min-h-12 rounded-xl bg-artisan-primary-wash/35 px-4 py-3 text-base font-semibold text-artisan-text';

const ProfilePage = () => {
  const { user } = useAuth();
  const { isAdmin, isSubAdmin, loading: isRoleLoading } = useUserRole();
  const isStaffAccount = isAdmin || isSubAdmin;
  const location = useLocation();
  const navigate = useNavigate();
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
  const editSnapshotRef = useRef(null);
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [accountData, setAccountData] = useState(null);
  const [hasApprovedPurchase, setHasApprovedPurchase] = useState(null);
  const [accountEligibilityError, setAccountEligibilityError] = useState('');
  const [isAccountActionSubmitting, setIsAccountActionSubmitting] = useState(false);
  const [pickupSettings, setPickupSettings] = useState(DEFAULT_PICKUP_SETTINGS);
  const [pickupDraft, setPickupDraft] = useState(DEFAULT_PICKUP_SETTINGS);
  const [isEditingPickupSettings, setIsEditingPickupSettings] = useState(false);
  const [isSavingPickupSettings, setIsSavingPickupSettings] = useState(false);
  const [pickupSettingsError, setPickupSettingsError] = useState('');

  const [countries] = useState(ALL_COUNTRIES);

  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAccountData(data);
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

  useEffect(() => {
    if (!isAdmin) return undefined;

    return onSnapshot(doc(db, 'settings', 'storefront'), (snapshot) => {
      setPickupSettings(normalizePickupSettings(snapshot.data()?.pickupSettings));
    });
  }, [isAdmin]);

  useEffect(() => {
    if (!user?.email) {
      setHasApprovedPurchase(null);
      return;
    }

    let isCurrent = true;
    setAccountEligibilityError('');
    setHasApprovedPurchase(null);

    getAccountPurchaseSummary(user.email)
      .then((summary) => {
        if (isCurrent) setHasApprovedPurchase(summary.hasApprovedPurchase);
      })
      .catch(() => {
        if (isCurrent) {
          setAccountEligibilityError('We could not verify your purchase history. Account changes are unavailable right now.');
          setHasApprovedPurchase(true);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [user?.email]);

  useEffect(() => {
    if (location.state?.onboarding) {
      setIsEditing(true);
    }
  }, [location.state]);

  const filteredPhoneCountries = countries.filter(country =>
    country.name.toLowerCase().includes(phoneCountrySearch.toLowerCase()) ||
    country.callingCode.includes(phoneCountrySearch)
  );

  const filteredAddressCountries = countries.filter(country =>
    country.name.toLowerCase().includes(addressCountrySearch.toLowerCase())
  );

  const startProfileEdit = () => {
    editSnapshotRef.current = {
      profile: structuredClone(profile),
      tempData: structuredClone(tempData),
    };
    setProfileFeedback(null);
    setIsEditing(true);
  };

  const cancelProfileEdit = () => {
    if (editSnapshotRef.current) {
      setProfile(editSnapshotRef.current.profile);
      setTempData(editSnapshotRef.current.tempData);
    }
    editSnapshotRef.current = null;
    setIsPhoneCountryOpen(false);
    setIsAddressCountryOpen(false);
    setPhoneCountrySearch('');
    setAddressCountrySearch('');
    setProfileFeedback(null);
    setIsEditing(false);
  };

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
      setProfileFeedback({ tone: 'error', text: 'Photo upload failed.' });
    }
  };

  const handleSave = async () => {
    if (isRoleLoading) {
      setProfileFeedback({ tone: 'error', text: 'Account permissions are still loading.' });
      return;
    }

    setProfileFeedback(null);
    try {
      const profileUpdates = {
        username: tempData.username.toLowerCase().trim(),
        fullName: tempData.fullName.trim(),
        displayName: tempData.fullName.trim(),
        phone: profile.phoneCountry.callingCode + " " + tempData.phone,
        birthdate: tempData.birthdate,
        profileCompleted: true,
      };

      if (!isStaffAccount) {
        profileUpdates.addresses = [{
          street: tempData.street,
          city: tempData.city,
          stateProvince: tempData.stateProvince,
          postalCode: tempData.postalCode,
          country: profile.address.countryObj.name,
          isDefault: true
        }];
      }

      await updateDoc(doc(db, 'users', user.uid), profileUpdates);
      editSnapshotRef.current = null;
      setIsEditing(false);
      setProfileFeedback({ tone: 'success', text: 'Profile updated.' });
    } catch (err) {
      setProfileFeedback({ tone: 'error', text: 'Profile could not be saved.' });
    }
  };

  const startPickupSettingsEdit = () => {
    setPickupDraft(pickupSettings);
    setPickupSettingsError('');
    setIsEditingPickupSettings(true);
  };

  const cancelPickupSettingsEdit = () => {
    setPickupDraft(pickupSettings);
    setPickupSettingsError('');
    setIsEditingPickupSettings(false);
  };

  const savePickupSettings = async () => {
    const nextPickupSettings = {
      location: pickupDraft.location.trim(),
      instructions: pickupDraft.instructions.trim(),
    };

    if (!nextPickupSettings.location || nextPickupSettings.location.length > 120) {
      setPickupSettingsError('Enter a pickup location of 120 characters or fewer.');
      return;
    }

    if (nextPickupSettings.instructions.length > 240) {
      setPickupSettingsError('Pickup instructions must be 240 characters or fewer.');
      return;
    }

    setIsSavingPickupSettings(true);
    setPickupSettingsError('');

    try {
      await setDoc(doc(db, 'settings', 'storefront'), {
        pickupSettings: nextPickupSettings,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setPickupSettings(nextPickupSettings);
      setIsEditingPickupSettings(false);
    } catch (error) {
      console.error('Unable to save local pickup settings', error);
      setPickupSettingsError('The pickup settings could not be saved. Please try again.');
    } finally {
      setIsSavingPickupSettings(false);
    }
  };

  const accountIsEligible =
    accountData?.hasApprovedOrders === false && hasApprovedPurchase === false && !accountEligibilityError;

  const handleDeactivateAccount = async () => {
    if (!accountIsEligible) {
      throw new Error('This account is not eligible for deactivation.');
    }

    setIsAccountActionSubmitting(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        accountStatus: 'deactivated',
        deactivatedAt: serverTimestamp(),
      });
      await signOut(auth);
      navigate('/login', { replace: true, state: { accountDeactivated: true } });
    } catch (error) {
      throw new Error(getAccountLifecycleErrorMessage(error));
    } finally {
      setIsAccountActionSubmitting(false);
    }
  };

  const handleDeleteAccount = async (password) => {
    if (!accountIsEligible) {
      throw new Error('This account is not eligible for deletion.');
    }

    setIsAccountActionSubmitting(true);
    try {
      await reauthenticateAccount({ user, password });
      await removeEligibleAccountData(user.uid);
      await deleteUser(auth.currentUser);
      navigate('/', { replace: true });
    } catch (error) {
      throw new Error(getAccountLifecycleErrorMessage(error));
    } finally {
      setIsAccountActionSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="artisan-grid-page flex min-h-screen items-center justify-center px-5">
        <p className="rounded-2xl border border-white/60 bg-white/95 px-6 py-5 text-center text-xl font-semibold text-artisan-text shadow-xl shadow-[#2D0E5A]/15">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>@{profile.username} - Profile</title></Helmet>

      <div className="artisan-grid-page relative min-h-screen overflow-hidden">

        <div className="relative z-10 container mx-auto max-w-6xl px-5 py-10 sm:px-8 md:py-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-5"
          >
            {/* Profile Header */}
            <header className="relative overflow-hidden rounded-[1.5rem] border border-artisan-primary/10 bg-[#FFFCFA]/95 px-6 py-6 text-artisan-text shadow-[0_18px_45px_-32px_rgba(45,14,90,0.45)] sm:px-8 sm:py-7">
              <div className="absolute inset-y-0 left-0 w-1 bg-artisan-primary" aria-hidden="true" />
              <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
              <div className="relative shrink-0">
                <div className="h-24 w-24 overflow-hidden rounded-[1.35rem] border border-artisan-primary/10 bg-white shadow-sm sm:h-28 sm:w-28">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt={`${profile.fullName} profile`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User size={48} className="text-artisan-primary" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                  aria-label="Upload a new profile photo"
                  className="absolute -bottom-1 -right-1 rounded-xl border-2 border-[#FFFCFA] bg-artisan-primary p-2.5 text-white shadow-md transition duration-200 hover:-translate-y-0.5 hover:bg-artisan-primary-mid active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary/40"
                >
                  <Camera size={18} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <h1 className="text-wrap-balance font-nunito text-3xl font-bold leading-tight tracking-[-0.025em] text-artisan-text sm:text-[2.15rem]">
                  {profile.fullName}
                </h1>
                <p className="mt-1 text-base font-semibold text-artisan-primary">@{profile.username}</p>
              </div>

              <a
                href={`mailto:${profile.email}`}
                className="group flex items-center gap-2 break-all border-b border-artisan-primary/20 pb-1 text-sm font-medium text-artisan-text-muted transition-colors hover:border-artisan-primary hover:text-artisan-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary/25 sm:ml-auto"
              >
                <Mail size={16} className="shrink-0 transition-transform duration-200 group-hover:-translate-y-0.5" aria-hidden="true" />
                {profile.email}
              </a>
            </div>
            </header>

            {/* Profile Info */}
            <div className="space-y-7 rounded-[1.75rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10 backdrop-blur-md sm:p-7 md:p-8">
              {location.state?.onboarding && !isRoleLoading && (
                <div className="rounded-2xl border border-artisan-primary/20 bg-artisan-primary-wash px-5 py-4 text-artisan-text">
                  <p className="font-bold">Complete your profile</p>
                  <p className="mt-1 text-sm text-artisan-text-muted">
                    {isStaffAccount
                      ? 'Please review your name and phone number before continuing.'
                      : 'Please review your name, phone number, and delivery address before continuing.'}
                  </p>
                </div>
              )}
              {/* Personal Info */}
              <section>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="font-nunito text-2xl font-bold tracking-tight text-artisan-text sm:text-3xl">Personal information</h2>
                  {isEditing ? (
                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                      <Button variant="outline" onClick={cancelProfileEdit} className="w-full sm:w-auto">Cancel</Button>
                      <Button onClick={handleSave} disabled={isRoleLoading} className="w-full sm:w-auto">
                        <Save className="mr-2" size={17} /> Save
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={startProfileEdit} disabled={isRoleLoading} className="w-full sm:w-auto">
                      <Edit className="mr-2" size={17} /> Edit
                    </Button>
                  )}
                </div>
                {profileFeedback && (
                  <p
                    role="status"
                    className={`mb-5 rounded-xl px-4 py-3 text-sm font-semibold ${profileFeedback.tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}
                  >
                    {profileFeedback.text}
                  </p>
                )}
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
                  <label className={FIELD_LABEL_CLASS}><Phone size={16} /> Phone number</label>
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
                            <div className="relative border-b border-artisan-primary/10 p-4">
                              <input
                                type="text"
                                placeholder="Search country..."
                                value={phoneCountrySearch}
                                onChange={(e) => setPhoneCountrySearch(e.target.value)}
                                className={`${FIELD_INPUT_CLASS} pr-12`}
                                autoFocus
                              />
                              <ClearSearchButton value={phoneCountrySearch} onClear={() => setPhoneCountrySearch('')} label="Clear phone country search" />
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
              {!isRoleLoading && !isStaffAccount && (
              <section className="rounded-[1.5rem] bg-artisan-primary-wash/30 p-5 sm:p-7">
                <div className="mb-7 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-artisan-primary text-white shadow-artisan-sm">
                    <MapPin size={21} />
                  </div>
                  <h2 className="font-nunito text-2xl font-bold tracking-tight text-artisan-text">Delivery address</h2>
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
                            <div className="relative border-b border-artisan-primary/10 p-4">
                              <input
                                type="text"
                                placeholder="Search country..."
                                value={addressCountrySearch}
                                onChange={(e) => setAddressCountrySearch(e.target.value)}
                                className={`${FIELD_INPUT_CLASS} pr-12`}
                                autoFocus
                              />
                              <ClearSearchButton value={addressCountrySearch} onClear={() => setAddressCountrySearch('')} label="Clear address country search" />
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
              )}

              {isAdmin && (
                <section className="rounded-[1.5rem] bg-artisan-primary-wash/25 p-5 sm:p-7">
                  <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-artisan-primary text-white shadow-artisan-sm">
                        <MapPin size={21} />
                      </div>
                      <h2 className="font-nunito text-2xl font-bold tracking-tight text-artisan-text">Local pickup</h2>
                    </div>
                    {!isEditingPickupSettings && (
                      <Button type="button" variant="outline" onClick={startPickupSettingsEdit}>
                        <Edit className="mr-2" size={17} /> Edit
                      </Button>
                    )}
                  </div>

                  {isEditingPickupSettings ? (
                    <div className="space-y-5">
                      <div>
                        <label className={FIELD_LABEL_CLASS} htmlFor="pickup-location">Pickup location</label>
                        <input
                          id="pickup-location"
                          type="text"
                          value={pickupDraft.location}
                          onChange={(event) => setPickupDraft((current) => ({ ...current, location: event.target.value }))}
                          maxLength={120}
                          required
                          className={FIELD_INPUT_CLASS}
                          placeholder="Quezon City"
                        />
                      </div>
                      <div>
                        <label className={FIELD_LABEL_CLASS} htmlFor="pickup-instructions">Customer instructions</label>
                        <textarea
                          id="pickup-instructions"
                          value={pickupDraft.instructions}
                          onChange={(event) => setPickupDraft((current) => ({ ...current, instructions: event.target.value }))}
                          maxLength={240}
                          rows={3}
                          className={`${FIELD_INPUT_CLASS} resize-y`}
                          placeholder="Schedule via chat."
                        />
                      </div>
                      {pickupSettingsError && (
                        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {pickupSettingsError}
                        </p>
                      )}
                      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={cancelPickupSettingsEdit} disabled={isSavingPickupSettings}>
                          Cancel
                        </Button>
                        <Button type="button" onClick={savePickupSettings} disabled={isSavingPickupSettings}>
                          <Save className="mr-2" size={18} />
                          {isSavingPickupSettings ? 'Saving…' : 'Save pickup settings'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-artisan-primary/10 bg-artisan-primary-wash/35 px-4 py-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-artisan-text-muted">Pickup location</p>
                        <p className="mt-1 text-lg font-semibold text-artisan-text">{pickupSettings.location}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-artisan-text-muted">Customer instructions</p>
                        <p className="mt-1 text-artisan-text-mid">{pickupSettings.instructions}</p>
                      </div>
                    </div>
                  )}
                </section>
              )}

              <AccountDangerZone
                user={user}
                isEligible={accountIsEligible}
                isCheckingEligibility={hasApprovedPurchase === null}
                eligibilityError={accountEligibilityError || (accountData && accountData.hasApprovedOrders !== false ? 'This account is not eligible for self-service deactivation or deletion. Contact support if you need assistance.' : '')}
                onDeactivate={handleDeactivateAccount}
                onDelete={handleDeleteAccount}
                isSubmitting={isAccountActionSubmitting}
              />

            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
