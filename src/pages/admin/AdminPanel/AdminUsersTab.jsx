import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  CheckCircle,
  X,
  AlertCircle,
  Truck,
  Clock,
  Award,
  ArrowRight,
  User,
  CalendarDays,
  CreditCard,
  Search,
  Filter,
  Eye,
  X as CloseIcon,
  Mail,
  Hash,
  Box,
  ReceiptText,
  MapPin,
  Phone,
  Wallet
} from "lucide-react";

const AdminUsersTab = (props) => {
  const {
    isAdmin,
    makeSubAdmin,
    removeSubAdmin,
    setUserSearch,
    user,
    userSearch,
  } = props;

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoadingUsers(true);
    setUsersError(null);

    return onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        setUsers(snapshot.docs.map((userDoc) => ({ id: userDoc.id, ...userDoc.data() })));
        setLoadingUsers(false);
      },
      (error) => {
        console.error('Users could not be loaded:', error);
        setUsersError('Users could not be loaded. Please try again.');
        setLoadingUsers(false);
      }
    );
  }, [refreshKey]);

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();
    if (!search) return users;

    return users.filter((account) => (
      account.name?.toLowerCase().includes(search) ||
      account.fullName?.toLowerCase().includes(search) ||
      account.displayName?.toLowerCase().includes(search) ||
      account.email?.toLowerCase().includes(search) ||
      account.role?.toLowerCase().includes(search)
    ));
  }, [userSearch, users]);

  useEffect(() => {
    setVisibleCount(5);
  }, [userSearch]);

  const visibleUsers = filteredUsers.slice(0, visibleCount);
  const hasMore = filteredUsers.length > visibleCount;
  const hasActiveSearch = Boolean(userSearch.trim());

  const clearSearch = () => setUserSearch('');

  return (
              <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/95 shadow-xl shadow-[#2D0E5A]/10">
                <div className="border-b border-artisan-primary/10 bg-artisan-primary-wash/45 p-5 sm:p-7">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Access management</p>
                      <h2 className="mt-1 font-nunito text-3xl font-bold text-artisan-text">Sub-admin Management</h2>
                      <p className="mt-1 text-sm text-artisan-text-muted">
                        Search users and promote trusted buyer accounts to Sub-admin / Artisan.
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
                      <Button
                        onClick={() => setRefreshKey((key) => key + 1)}
                        className="w-full lg:w-auto"
                      >
                        Reload Users
                      </Button>
                    </div>
                  </div>

                  {!isAdmin && (
                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                      You can view users, but only the main admin can promote or remove Sub-admin accounts.
                    </div>
                  )}

                  <div className="relative mt-5">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-artisan-text-faint"
                    />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search loaded users by name, email, or role..."
                      className="w-full rounded-2xl border border-artisan-border bg-white py-3 pl-11 pr-4 text-sm text-artisan-text outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-artisan-text-faint focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                    />
                  </div>
                </div>

                <div>
                  {loadingUsers ? (
                    <div className="p-16 text-center text-artisan-text-muted">
                      Loading users...
                    </div>
                  ) : (
                    <>
                    <div className="hidden max-h-[42rem] overflow-auto md:block">
                    <table className="artisan-data-table w-full min-w-[720px]">
                      <thead className="sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="p-4 text-left text-sm font-bold">Name</th>
                          <th className="p-4 text-left text-sm font-bold">Email</th>
                          <th className="p-4 text-left text-sm font-bold">Current Role</th>
                          <th className="p-4 text-left text-sm font-bold">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleUsers.map((u) => {
                          const userRole = u.role || "buyer";
                          const displayName = u.name || u.displayName || "No name";
                          const isCurrentUser = u.id === user?.uid;

                          return (
                            <tr key={u.id} className="border-t border-artisan-primary/10 transition-colors duration-200 hover:bg-artisan-primary-wash/30">
                              <td className="p-4 font-medium text-artisan-text">
                                <div className="flex flex-col">
                                  <span>{displayName}</span>
                                  {isCurrentUser && (
                                    <span className="mt-1 text-xs font-semibold text-artisan-primary">
                                      Current user
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="p-4 text-artisan-text-muted">
                                {u.email || "No email"}
                              </td>

                              <td className="p-4">
                                <RoleBadge role={userRole} />
                              </td>

                              <td className="p-4">
                                <UserRoleAction
                                  userId={u.id}
                                  userRole={userRole}
                                  isAdmin={isAdmin}
                                  isCurrentUser={isCurrentUser}
                                  makeSubAdmin={makeSubAdmin}
                                  removeSubAdmin={removeSubAdmin}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>

                    <div className="max-h-[42rem] space-y-4 overflow-y-auto p-4 md:hidden">
                      {visibleUsers.map((u) => {
                        const userRole = u.role || 'buyer';
                        const displayName = u.name || u.displayName || 'No name';
                        const isCurrentUser = u.id === user?.uid;

                        return (
                          <article key={u.id} className="rounded-2xl border border-artisan-primary/10 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-bold text-artisan-text">{displayName}</p>
                                <p className="mt-1 break-all text-sm text-artisan-text-muted">{u.email || 'No email'}</p>
                              </div>
                              <RoleBadge role={userRole} />
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-artisan-primary/10 pt-4">
                              {isCurrentUser ? (
                                <span className="text-xs font-semibold text-artisan-primary">Current user</span>
                              ) : (
                                <span className="text-xs text-artisan-text-muted">Account access</span>
                              )}
                              <UserRoleAction
                                userId={u.id}
                                userRole={userRole}
                                isAdmin={isAdmin}
                                isCurrentUser={isCurrentUser}
                                makeSubAdmin={makeSubAdmin}
                                removeSubAdmin={removeSubAdmin}
                              />
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    </>
                  )}

                  {!loadingUsers && users.length === 0 && (
                    <div className="p-16 text-center text-artisan-text-muted">
                      <User size={56} className="mx-auto mb-4 text-artisan-primary-pale" />
                      <p className="text-lg font-semibold text-artisan-text">No users found</p>
                      <p className="text-sm mt-1">New accounts will appear here automatically.</p>
                    </div>
                  )}

                  {!loadingUsers && users.length > 0 && filteredUsers.length === 0 && (
                    <div className="p-16 text-center text-artisan-text-muted">
                      <Search size={56} className="mx-auto mb-4 text-artisan-primary-pale" />
                      <p className="text-lg font-semibold text-artisan-text">No matching users</p>
                      <p className="text-sm mt-1">Search only includes the users loaded so far. Try another term or load more users.</p>
                      <Button variant="outline" size="sm" onClick={clearSearch} className="mt-5">
                        Clear search
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-3 border-t border-artisan-primary/10 px-5 py-6 sm:flex-row sm:justify-center">
                    {usersError && <p className="text-sm text-red-600">{usersError}</p>}
                    {hasMore && (
                      <Button variant="outline" onClick={() => setVisibleCount((count) => count + 5)}>
                        Load 5 more users
                      </Button>
                    )}
                    {visibleCount > 5 && (
                      <Button variant="outline" onClick={() => setVisibleCount(5)}>
                        Show fewer users
                      </Button>
                    )}
                    {hasActiveSearch && visibleUsers.length > 0 && (
                      <Button variant="outline" onClick={clearSearch}>
                        Clear search
                      </Button>
                    )}
                  </div>
                </div>
              </div>
  );
};

const RoleBadge = ({ role }) => {
  const styles = {
    admin: 'bg-purple-100 text-purple-700',
    'sub-admin': 'bg-artisan-primary-wash text-artisan-primary',
    buyer: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles[role] || styles.buyer}`}>
      {role}
    </span>
  );
};

const UserRoleAction = ({
  userId,
  userRole,
  isAdmin,
  isCurrentUser,
  makeSubAdmin,
  removeSubAdmin,
}) => {
  if (userRole === 'admin') {
    return <span className="text-sm font-semibold text-artisan-text-faint">Protected</span>;
  }

  if (!isAdmin) {
    return <span className="text-sm font-semibold text-artisan-text-faint">View only</span>;
  }

  if (userRole === 'sub-admin') {
    return (
      <Button
        size="sm"
        onClick={() => removeSubAdmin(userId)}
        disabled={isCurrentUser}
        className="bg-red-600 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Remove Sub-admin
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      onClick={() => makeSubAdmin(userId)}
      disabled={isCurrentUser}
      className="disabled:cursor-not-allowed disabled:opacity-50"
    >
      Make Sub-admin
    </Button>
  );
};

export default AdminUsersTab;
