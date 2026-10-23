import React from 'react';
import { ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import styles from './AdminDashboard.module.css';

const AdminWorkspaceHeader = ({ isAdmin, awaitingReviewCount, onReviewOrders, user }) => {
  const firstName = user?.displayName?.trim().split(/\s+/)[0];
  const hasPendingReviews = awaitingReviewCount > 0;
  const dateLabel = new Intl.DateTimeFormat('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila',
  }).format(new Date());

  return (
    <>
      <header className={styles.workspaceHeader}>
        <div className={styles.headerArt} aria-hidden="true" />
        <div className={styles.headerInner}>
          <div>
            <p className="text-sm font-semibold text-artisan-primary">{firstName ? `Welcome back, ${firstName}.` : 'Welcome to your workspace.'}</p>
            <h1 className={styles.headerTitle}>Your store, at a glance.</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-artisan-text-muted">Keep orders moving, care for your customers, and see how your store is doing.</p>
          </div>
          <div className={styles.headerMeta}>
            <span className={styles.roleTag}>{isAdmin ? 'Main admin' : 'Sub-admin'} workspace</span>
            <span>{dateLabel}</span>
          </div>
        </div>
      </header>
      <section className={styles.reviewBanner} data-clear={!hasPendingReviews} aria-label="Order review summary">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0" aria-hidden="true">{hasPendingReviews ? <Clock size={21} className="text-amber-800" /> : <CheckCircle size={21} className="text-emerald-800" />}</span>
          <div>
            <h2 className="text-sm font-extrabold text-artisan-text">{hasPendingReviews ? `${awaitingReviewCount} ${awaitingReviewCount === 1 ? 'order needs' : 'orders need'} your review` : 'New order reviews are all caught up'}</h2>
            <p className="mt-1 text-xs leading-5 text-artisan-text-muted">{hasPendingReviews ? 'Start with these requests before accepting and preparing orders.' : 'Check your orders for any work already in progress.'}</p>
          </div>
        </div>
        <Button type="button" variant={hasPendingReviews ? 'default' : 'outline'} size="sm" onClick={() => onReviewOrders(hasPendingReviews)} className="w-full shrink-0 sm:w-auto">
          {hasPendingReviews ? 'Review orders' : 'View orders'}<ArrowRight size={15} className="ml-2" aria-hidden="true" />
        </Button>
      </section>
    </>
  );
};

export default AdminWorkspaceHeader;
