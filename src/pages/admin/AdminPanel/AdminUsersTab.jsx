import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import {
  AlertCircle,
  CheckCircle2,
  Crown,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClearSearchButton } from '@/components/ui/clear-search-button';
import { db } from '@/lib/firebase';

const ROLE_PRIORITY = {
  admin: 0,
  'sub-admin': 1,
  buyer: 2,
  customer: 2,
};

const getDisplayName = (account) => (
  account.name || account.fullName || account.displayName || 'Unnamed account'
);

const getAccountStatus = (account) => (
  account.accountStatus === 'deactivated' ? 'deactivated' : 'active'
);

const getInitials = (account) => {
  const displayName = getDisplayName(account).trim();
  if (!displayName) return 'U';

  return displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

const AdminUsersTab = ({
  isAdmin,
  makeSubAdmin,
  removeSubAdmin,
  setUserSearch,
  user,
  userSearch,
}) => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [visibleCount, setVisibleCount] = useState(5);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [roleChangeError, setRoleChangeError] = useState('');
  const [roleChangeNotice, setRoleChangeNotice] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState('');

  useEffect(() => {
    setLoadingUsers(true);
    setUsersError('');

    return onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        setUsers(snapshot.docs.map((userDoc) => ({ id: userDoc.id, ...userDoc.data() })));
        setUsersError('');
        setLoadingUsers(false);
      },
      (error) => {
        console.error('Users could not be loaded:', error);
        setUsersError('Users could not be loaded. Check your connection and try again.');
        setLoadingUsers(false);
      },
    );
  }, [refreshKey]);

  const filteredUsers = useMemo(() => {
    const search = userSearch.trim().toLowerCase();
    const matches = search
      ? users.filter((account) => (
        getDisplayName(account).toLowerCase().includes(search)
        || account.email?.toLowerCase().includes(search)
        || account.role?.toLowerCase().includes(search)
        || getAccountStatus(account).includes(search)
      ))
      : users;

    return matches.slice().sort((first, second) => {
      const roleDifference = (ROLE_PRIORITY[first.role] ?? 3) - (ROLE_PRIORITY[second.role] ?? 3);
      if (roleDifference !== 0) return roleDifference;

      return getDisplayName(first).localeCompare(getDisplayName(second));
    });
  }, [userSearch, users]);

  const accountCounts = useMemo(() => ({
    total: users.length,
    subAdmins: users.filter((account) => account.role === 'sub-admin').length,
    customers: users.filter((account) => !['admin', 'sub-admin'].includes(account.role)).length,
    inactive: users.filter((account) => getAccountStatus(account) === 'deactivated').length,
  }), [users]);

  useEffect(() => {
    setVisibleCount(5);
  }, [userSearch]);

  const visibleUsers = filteredUsers.slice(0, visibleCount);
  const hasMore = filteredUsers.length > visibleCount;
  const hasActiveSearch = Boolean(userSearch.trim());

  const clearSearch = () => setUserSearch('');

  const retryUsers = () => {
    setUsersError('');
    setRefreshKey((key) => key + 1);
  };

  const requestRoleChange = (account, targetRole) => {
    setRoleChangeError('');
    setRoleChangeNotice(null);
    setPendingRoleChange({ account, targetRole });
  };

  const closeRoleChange = () => {
    if (updatingUserId) return;
    setRoleChangeError('');
    setPendingRoleChange(null);
  };

  const confirmRoleChange = async () => {
    if (!pendingRoleChange || updatingUserId) return;

    const { account, targetRole } = pendingRoleChange;
    const displayName = getDisplayName(account);
    setUpdatingUserId(account.id);
    setRoleChangeError('');

    try {
      if (targetRole === 'sub-admin') {
        await makeSubAdmin(account.id);
        setRoleChangeNotice({
          type: 'success',
          message: `${displayName} now has Sub-admin access.`,
        });
      } else {
        await removeSubAdmin(account.id);
        setRoleChangeNotice({
          type: 'success',
          message: `${displayName}'s Sub-admin access was removed.`,
        });
      }

      setPendingRoleChange(null);
    } catch (error) {
      setRoleChangeError(error?.message || 'The account access could not be updated. Please try again.');
    } finally {
      setUpdatingUserId('');
    }
  };

  return (
    <section
      aria-labelledby="users-heading"
      className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 shadow-xl shadow-[#2D0E5A]/10"
    >
      <div className="border-b border-artisan-primary/10 bg-[radial-gradient(circle_at_top_right,rgba(118,72,179,0.12),transparent_38%),linear-gradient(180deg,rgba(248,245,252,0.96),rgba(255,255,255,0.98))] p-5 sm:p-7">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(34rem,0.95fr)] xl:items-end">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Access management</p>
            <h2 id="users-heading" className="mt-2 font-nunito text-3xl font-bold tracking-tight text-artisan-text sm:text-4xl">Users & access</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-artisan-text-muted sm:text-base">
              Find customer accounts, see who can help manage the store, and control Sub-admin access.
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <UserSummary label="All accounts" value={accountCounts.total} tone="primary" />
            <UserSummary label="Sub-admins" value={accountCounts.subAdmins} />
            <UserSummary label="Customers" value={accountCounts.customers} />
            <UserSummary label="Inactive" value={accountCounts.inactive} tone={accountCounts.inactive > 0 ? 'attention' : 'default'} />
          </dl>
        </div>

        {!isAdmin && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
            <ShieldCheck size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold">View-only access</p>
              <p className="mt-1 text-sm leading-5">You can review user accounts, but only the main admin can grant or remove Sub-admin access.</p>
            </div>
          </div>
        )}

        <div className="mt-5 rounded-2xl border border-artisan-primary/10 bg-white/90 p-3 shadow-sm sm:p-4">
          <label htmlFor="user-search" className="relative block">
            <span className="sr-only">Search users</span>
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-artisan-text-faint" />
            <input
              id="user-search"
              type="search"
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Search by name, email, role, or account status"
              className="h-12 w-full rounded-xl border border-artisan-border bg-white pl-11 pr-12 text-sm text-artisan-text outline-none transition placeholder:text-artisan-text-faint hover:border-artisan-primary/40 focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
            />
            <ClearSearchButton value={userSearch} onClear={clearSearch} label="Clear user search" />
          </label>
          <div className="mt-3 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-artisan-text-muted" aria-live="polite">
              Showing <span className="font-bold tabular-nums text-artisan-text">{visibleUsers.length}</span> of{' '}
              <span className="font-bold tabular-nums text-artisan-text">{filteredUsers.length}</span> matching account{filteredUsers.length === 1 ? '' : 's'}
            </p>
            {hasActiveSearch && (
              <button type="button" onClick={clearSearch} className="w-fit text-sm font-semibold text-artisan-primary underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary">
                Clear search
              </button>
            )}
          </div>
        </div>
      </div>

      <div>
        {roleChangeNotice && (
          <div className="flex items-start justify-between gap-3 border-b border-emerald-200 bg-emerald-50 px-5 py-3 text-sm text-emerald-900" role="status" aria-live="polite">
            <div className="flex items-start gap-2">
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{roleChangeNotice.message}</p>
            </div>
            <button type="button" onClick={() => setRoleChangeNotice(null)} aria-label="Dismiss access update message" className="rounded-md p-1 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {usersError && users.length > 0 && (
          <div className="flex flex-col gap-3 border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between" role="alert">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>{usersError} The accounts below may be out of date.</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={retryUsers}>
              <RefreshCw size={15} className="mr-2" aria-hidden="true" /> Retry
            </Button>
          </div>
        )}

        {loadingUsers ? (
          <UsersLoadingState />
        ) : usersError && users.length === 0 ? (
          <UsersErrorState message={usersError} onRetry={retryUsers} />
        ) : visibleUsers.length > 0 ? (
          <>
            <div className="hidden max-h-[46rem] overflow-auto md:block">
              <table className="artisan-data-table w-full min-w-[760px]">
                <caption className="sr-only">User accounts matching the current search</caption>
                <thead className="sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-4 text-left text-sm font-bold">User</th>
                    <th className="p-4 text-left text-sm font-bold">Access level</th>
                    <th className="p-4 text-left text-sm font-bold">Account status</th>
                    <th className="p-4 text-right text-sm font-bold">Admin access</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((account) => {
                    const userRole = account.role || 'buyer';
                    const accountStatus = getAccountStatus(account);
                    const isCurrentUser = account.id === user?.uid;

                    return (
                      <tr key={account.id} className="border-t border-artisan-primary/10 transition-colors duration-200 hover:bg-artisan-primary-wash/30">
                        <td className="p-4 align-top">
                          <UserIdentity account={account} isCurrentUser={isCurrentUser} />
                        </td>
                        <td className="p-4 align-top"><RoleBadge role={userRole} /></td>
                        <td className="p-4 align-top"><AccountStatusBadge status={accountStatus} /></td>
                        <td className="p-4 text-right align-top">
                          <UserRoleAction
                            account={account}
                            userRole={userRole}
                            accountStatus={accountStatus}
                            isAdmin={isAdmin}
                            isCurrentUser={isCurrentUser}
                            isUpdating={updatingUserId === account.id}
                            onRequestRoleChange={requestRoleChange}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="max-h-[46rem] space-y-3 overflow-y-auto bg-artisan-primary-wash/20 p-3 md:hidden">
              {visibleUsers.map((account) => {
                const userRole = account.role || 'buyer';
                const accountStatus = getAccountStatus(account);
                const isCurrentUser = account.id === user?.uid;

                return (
                  <article key={account.id} className="rounded-2xl border border-artisan-primary/10 bg-white p-4 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-artisan-primary/30 hover:shadow-md">
                    <UserIdentity account={account} isCurrentUser={isCurrentUser} />
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-y border-artisan-primary/10 py-3">
                      <RoleBadge role={userRole} />
                      <AccountStatusBadge status={accountStatus} />
                    </div>
                    <div className="mt-4 flex justify-end">
                      <UserRoleAction
                        account={account}
                        userRole={userRole}
                        accountStatus={accountStatus}
                        isAdmin={isAdmin}
                        isCurrentUser={isCurrentUser}
                        isUpdating={updatingUserId === account.id}
                        onRequestRoleChange={requestRoleChange}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : users.length === 0 ? (
          <UsersEmptyState
            icon={<UsersRound size={44} aria-hidden="true" />}
            title="No user accounts yet"
            copy="New registered accounts will appear here automatically."
          />
        ) : (
          <UsersEmptyState
            icon={<Search size={42} aria-hidden="true" />}
            title="No matching accounts"
            copy="Try a different name, email, role, or account status."
            action={<Button variant="outline" size="sm" onClick={clearSearch}>Clear search</Button>}
          />
        )}

        {!loadingUsers && !usersError && visibleUsers.length > 0 && (
          <div className="flex flex-col items-center gap-3 border-t border-artisan-primary/10 px-5 py-5 sm:flex-row sm:justify-between">
            <p className="text-sm tabular-nums text-artisan-text-muted">
              Displaying {visibleUsers.length} of {filteredUsers.length} matching account{filteredUsers.length === 1 ? '' : 's'}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {hasMore && <Button variant="outline" onClick={() => setVisibleCount((count) => count + 5)}>Load 5 more</Button>}
              {visibleCount > 5 && <Button variant="ghost" onClick={() => setVisibleCount(5)}>Show fewer</Button>}
            </div>
          </div>
        )}
      </div>

      {pendingRoleChange && (
        <RoleChangeDialog
          change={pendingRoleChange}
          error={roleChangeError}
          isSaving={updatingUserId === pendingRoleChange.account.id}
          onCancel={closeRoleChange}
          onConfirm={confirmRoleChange}
        />
      )}
    </section>
  );
};

const UserSummary = ({ label, value, tone = 'default' }) => {
  const toneClass = tone === 'attention'
    ? 'border-amber-200 bg-amber-50/90 text-amber-900'
    : tone === 'primary'
      ? 'border-artisan-primary/20 bg-artisan-primary text-white'
      : 'border-artisan-primary/10 bg-white/90 text-artisan-text';

  return (
    <div className={`rounded-xl border px-3 py-3 shadow-sm ${toneClass}`}>
      <dt className={`text-[0.68rem] font-bold uppercase tracking-[0.1em] ${tone === 'primary' ? 'text-white/75' : 'text-current opacity-65'}`}>{label}</dt>
      <dd className="mt-1 text-xl font-bold tabular-nums">{value}</dd>
    </div>
  );
};

const UserIdentity = ({ account, isCurrentUser }) => (
  <div className="flex min-w-0 items-center gap-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-artisan-primary-wash text-sm font-bold text-artisan-primary">
      {getInitials(account)}
    </div>
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-bold text-artisan-text">{getDisplayName(account)}</p>
        {isCurrentUser && <span className="rounded-md bg-artisan-primary-wash px-1.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide text-artisan-primary">You</span>}
      </div>
      <p className="mt-0.5 break-all text-sm text-artisan-text-muted">{account.email || 'No email recorded'}</p>
    </div>
  </div>
);

const RoleBadge = ({ role }) => {
  const roleMeta = {
    admin: {
      label: 'Main admin',
      icon: <Crown size={13} aria-hidden="true" />,
      className: 'border-purple-200 bg-purple-50 text-purple-800',
    },
    'sub-admin': {
      label: 'Sub-admin',
      icon: <ShieldCheck size={13} aria-hidden="true" />,
      className: 'border-artisan-primary/20 bg-artisan-primary-wash text-artisan-primary',
    },
    buyer: {
      label: 'Customer',
      icon: <UserRound size={13} aria-hidden="true" />,
      className: 'border-slate-200 bg-slate-50 text-slate-700',
    },
    customer: {
      label: 'Customer',
      icon: <UserRound size={13} aria-hidden="true" />,
      className: 'border-slate-200 bg-slate-50 text-slate-700',
    },
  };
  const meta = roleMeta[role] || roleMeta.buyer;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${meta.className}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
};

const AccountStatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${status === 'deactivated' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${status === 'deactivated' ? 'bg-red-500' : 'bg-emerald-500'}`} aria-hidden="true" />
    {status === 'deactivated' ? 'Inactive' : 'Active'}
  </span>
);

const UserRoleAction = ({
  account,
  userRole,
  accountStatus,
  isAdmin,
  isCurrentUser,
  isUpdating,
  onRequestRoleChange,
}) => {
  if (userRole === 'admin') {
    return <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-artisan-text-faint"><Crown size={15} aria-hidden="true" /> Protected</span>;
  }

  if (!isAdmin) {
    return <span className="text-sm font-semibold text-artisan-text-faint">View only</span>;
  }

  if (userRole === 'sub-admin') {
    return (
      <Button type="button" size="sm" variant="outline" disabled={isCurrentUser || isUpdating} onClick={() => onRequestRoleChange(account, 'buyer')} className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">
        {isUpdating && <RefreshCw size={14} className="mr-2 animate-spin" aria-hidden="true" />}
        Remove access
      </Button>
    );
  }

  if (accountStatus === 'deactivated') {
    return <span className="text-sm font-semibold text-artisan-text-faint">Unavailable while inactive</span>;
  }

  return (
    <Button type="button" size="sm" disabled={isCurrentUser || isUpdating} onClick={() => onRequestRoleChange(account, 'sub-admin')}>
      {isUpdating && <RefreshCw size={14} className="mr-2 animate-spin" aria-hidden="true" />}
      Grant Sub-admin access
    </Button>
  );
};

const RoleChangeDialog = ({ change, error, isSaving, onCancel, onConfirm }) => {
  const isPromotion = change.targetRole === 'sub-admin';
  const displayName = getDisplayName(change.account);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1D1033]/55 p-4 backdrop-blur-sm"
      role="presentation"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onCancel();
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="role-change-title" aria-describedby="role-change-description" className="w-full max-w-lg rounded-[1.75rem] border border-white/70 bg-white p-6 shadow-2xl shadow-[#1D1033]/25 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isPromotion ? 'bg-artisan-primary-wash text-artisan-primary' : 'bg-red-50 text-red-700'}`}>
            {isPromotion ? <ShieldCheck size={24} aria-hidden="true" /> : <AlertCircle size={24} aria-hidden="true" />}
          </span>
          <button type="button" disabled={isSaving} onClick={onCancel} aria-label="Close role change confirmation" className="rounded-lg p-2 text-artisan-text-muted transition hover:bg-artisan-primary-wash hover:text-artisan-text disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <h3 id="role-change-title" className="mt-5 font-nunito text-2xl font-bold tracking-tight text-artisan-text">
          {isPromotion ? 'Grant Sub-admin access?' : 'Remove Sub-admin access?'}
        </h3>
        <p id="role-change-description" className="mt-2 text-sm leading-6 text-artisan-text-muted">
          {isPromotion
            ? `${displayName} will be able to help manage products, orders, messages, and analytics. Main-admin-only controls remain protected.`
            : `${displayName} will return to customer access and will no longer be able to use the admin workspace.`}
        </p>

        <div className="mt-5 rounded-xl border border-artisan-primary/10 bg-artisan-primary-wash/35 px-4 py-3">
          <p className="font-semibold text-artisan-text">{displayName}</p>
          <p className="mt-0.5 break-all text-sm text-artisan-text-muted">{change.account.email || 'No email recorded'}</p>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800" role="alert">
            <AlertCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={isSaving} onClick={onCancel}>Cancel</Button>
          <Button type="button" variant={isPromotion ? 'default' : 'destructive'} disabled={isSaving} onClick={onConfirm} autoFocus>
            {isSaving && <RefreshCw size={15} className="mr-2 animate-spin" aria-hidden="true" />}
            {isSaving ? 'Updating access…' : isPromotion ? 'Grant access' : 'Remove access'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const UsersLoadingState = () => (
  <div className="space-y-3 p-4 sm:p-5" aria-label="Loading users">
    {[0, 1, 2, 3].map((item) => (
      <div key={item} className="grid animate-pulse grid-cols-[2.5rem_minmax(0,1fr)_5rem] items-center gap-3 rounded-xl border border-artisan-primary/5 p-3 sm:grid-cols-[2.5rem_minmax(0,1fr)_7rem_7rem]">
        <div className="h-10 w-10 rounded-xl bg-artisan-primary-wash" />
        <div><div className="h-3 w-32 rounded bg-artisan-primary-wash" /><div className="mt-2 h-2.5 w-48 max-w-full rounded bg-artisan-primary-wash/70" /></div>
        <div className="h-7 rounded-lg bg-artisan-primary-wash" />
        <div className="hidden h-7 rounded-lg bg-artisan-primary-wash sm:block" />
      </div>
    ))}
  </div>
);

const UsersErrorState = ({ message, onRetry }) => (
  <div className="px-6 py-16 text-center text-artisan-text-muted">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600"><AlertCircle size={30} aria-hidden="true" /></div>
    <p className="text-lg font-semibold text-artisan-text">User accounts are unavailable</p>
    <p className="mx-auto mt-1 max-w-md text-sm leading-6">{message}</p>
    <Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-5"><RefreshCw size={15} className="mr-2" aria-hidden="true" /> Retry loading</Button>
  </div>
);

const UsersEmptyState = ({ icon, title, copy, action = null }) => (
  <div className="px-6 py-16 text-center text-artisan-text-muted">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-artisan-primary-wash text-artisan-primary-pale">{icon}</div>
    <p className="text-lg font-semibold text-artisan-text">{title}</p>
    <p className="mx-auto mt-1 max-w-md text-sm leading-6">{copy}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default AdminUsersTab;
