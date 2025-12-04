// src/pages/ProfilePage.jsx ← FINAL: ADDRESS COUNTRY CHANGEABLE + LUXURY
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/lib/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Camera, Save, User, AtSign, Mail, Calendar, MapPin, ChevronDown } from 'lucide-react';

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>@{profile.username} - Profile</title></Helmet>

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center gap-12 mb-16">
            <div className="relative">
              <div className="w-48 h-48 rounded-full overflow-hidden bg-gray-200 border-8 border-white shadow-2xl">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User size={96} className="text-gray-400" />
                  </div>
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-4 right-4 bg-[#118C8C] text-white p-4 rounded-full shadow-lg hover:bg-[#0d7070] transition"
              >
                <Camera size={28} />
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
              <h1 className="text-6xl font-bold text-[#118C8C]">
                {profile.username}
              </h1>
              <p className="text-3xl text-gray-700 mt-4">{profile.fullName}</p>
              <p className="text-xl text-gray-600 mt-6 flex items-center gap-3 justify-center md:justify-start">
                <Mail size={24} /> {profile.email}
              </p>
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-10">
            {/* Personal Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <label className="text-lg font-medium text-gray-700 flex items-center gap-3 mb-3">
                  <AtSign size={22} /> Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempData.username}
                    onChange={(e) => setTempData({...tempData, username: e.target.value})}
                    className="w-full px-6 py-5 border-2 rounded-xl focus:border-[#118C8C] transition text-xl"
                    placeholder="juandelacruz123"
                  />
                ) : (
                  <p className="text-2xl font-bold">{profile.username}</p>
                )}
              </div>

              <div>
                <label className="text-lg font-medium text-gray-700 flex items-center gap-3 mb-3">
                  <User size={22} /> Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={tempData.fullName}
                    onChange={(e) => setTempData({...tempData, fullName: e.target.value})}
                    className="w-full px-6 py-4 border-2 rounded-xl focus:border-[#118C8C] transition text-xl"
                  />
                ) : (
                  <p className="text-2xl">{profile.fullName}</p>
                )}
              </div>

              {/* PHONE WITH COUNTRY SELECTOR */}
              <div>
                <label className="text-lg font-medium text-gray-700 mb-3 block">Phone Number</label>
                {isEditing ? (
                  <div className="flex gap-4">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsPhoneCountryOpen(!isPhoneCountryOpen)}
                        className="flex items-center gap-3 px-5 py-4 bg-gray-50 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition"
                      >
                        <img src={profile.phoneCountry?.flag || ALL_COUNTRIES[0].flag} alt="" className="w-8 h-6 rounded" />
                        <span className="font-medium">{profile.phoneCountry?.callingCode || "+63"}</span>
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
                                setProfile(prev => ({ ...prev, phoneCountry: country }));
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
                      type="text"
                      value={tempData.phone}
                      onChange={(e) => setTempData({...tempData, phone: e.target.value})}
                      className="flex-1 px-6 py-4 border-2 rounded-xl focus:border-[#118C8C] transition text-xl"
                      placeholder="912 345 6789"
                    />
                  </div>
                ) : (
                  <p className="text-2xl flex items-center gap-3">
                    <img src={profile.phoneCountry?.flag || ALL_COUNTRIES[0].flag} alt="" className="w-10 h-7 rounded" />
                    {profile.phoneCountry?.callingCode || "+63"} {profile.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="text-lg font-medium text-gray-700 flex items-center gap-3 mb-3">
                  <Calendar size={22} /> Birthdate
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={tempData.birthdate}
                    onChange={(e) => setTempData({...tempData, birthdate: e.target.value})}
                    className="w-full px-6 py-4 border-2 rounded-xl focus:border-[#118C8C] transition text-xl"
                  />
                ) : (
                  <p className="text-2xl">{profile.birthdate || "Not set"}</p>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mt-16 pt-10 border-t-4 border-[#118C8C]/20">
              <h3 className="text-3xl font-bold text-[#118C8C] mb-8 flex items-center gap-4">
                <MapPin size={36} /> Address
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="text-lg font-medium text-gray-700 mb-3 block">Street Address</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempData.street}
                      onChange={(e) => setTempData({...tempData, street: e.target.value})}
                      className="w-full px-6 py-4 border-2 rounded-xl focus:border-[#118C8C] transition text-xl"
                      placeholder="123 Sampaguita St"
                    />
                  ) : (
                    <p className="text-xl">{profile.address.street || "Not set"}</p>
                  )}
                </div>

                <div>
                  <label className="text-lg font-medium text-gray-700 mb-3 block">City</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempData.city}
                      onChange={(e) => setTempData({...tempData, city: e.target.value})}
                      className="w-full px-6 py-4 border-2 rounded-xl focus:border-[#118C8C] transition text-xl"
                    />
                  ) : (
                    <p className="text-xl">{profile.address.city || "Not set"}</p>
                  )}
                </div>

                <div>
                  <label className="text-lg font-medium text-gray-700 mb-3 block">State / Province</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempData.stateProvince}
                      onChange={(e) => setTempData({...tempData, stateProvince: e.target.value})}
                      className="w-full px-6 py-4 border-2 rounded-xl focus:border-[#118C8C] transition text-xl"
                    />
                  ) : (
                    <p className="text-xl">{profile.address.stateProvince || "Not set"}</p>
                  )}
                </div>

                <div>
                  <label className="text-lg font-medium text-gray-700 mb-3 block">Postal / ZIP Code</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={tempData.postalCode}
                      onChange={(e) => setTempData({...tempData, postalCode: e.target.value})}
                      className="w-full px-6 py-4 border-2 rounded-xl focus:border-[#118C8C] transition text-xl"
                    />
                  ) : (
                    <p className="text-xl">{profile.address.postalCode || "Not set"}</p>
                  )}
                </div>

                {/* COUNTRY SELECTOR FOR ADDRESS */}
                <div className="md:col-span-2">
                  <label className="text-lg font-medium text-gray-700 mb-3 block">Country</label>
                  {isEditing ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsAddressCountryOpen(!isAddressCountryOpen)}
                        className="w-full flex items-center justify-between px-6 py-5 bg-gray-50 border-2 border-gray-300 rounded-xl hover:bg-gray-100 transition text-left"
                      >
                        <div className="flex items-center gap-4">
                          <img src={profile.address.countryObj.flag} alt="" className="w-10 h-7 rounded" />
                          <span className="font-medium">{profile.address.countryObj.name}</span>
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
                                setProfile(prev => ({ ...prev, address: { ...prev.address, countryObj: country } }));
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
                  ) : (
                    <div className="flex items-center gap-4">
                      <img src={profile.address.countryObj.flag} alt="" className="w-12 h-9 rounded shadow" />
                      <p className="text-2xl font-bold">{profile.address.country}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Button */}
            <div className="text-center pt-12">
              {isEditing ? (
                <div className="flex justify-center gap-8">
                  <Button onClick={handleSave} size="lg" className="bg-[#118C8C] hover:bg-[#0d7070] px-16 py-5 text-xl">
                    <Save className="mr-3" size={24} /> Save Changes
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setIsEditing(false)} className="px-12 py-5 text-xl">
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button size="lg" onClick={() => setIsEditing(true)} className="px-16 py-5 text-xl">
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;