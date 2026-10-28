import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock3,
  FileText,
  HelpCircle,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { createNotificationsForUsers, createNotification } from '@/lib/notifications';
import { createContentItemId, normalizeSiteContentSection } from '@/data/siteContent';
import { useSiteContent } from '@/hooks/useSiteContent';

const CONTENT_SECTIONS = [
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
  { id: 'terms', label: 'Terms of Service', icon: FileText },
];

const cloneValue = (value) => structuredClone(value);

const getLocalTodayKey = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTimestampMillis = (value) => {
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  return 0;
};

const validateContentDraft = (section, draft) => {
  if (section === 'faqs') {
    if (!Array.isArray(draft) || draft.length < 1 || draft.length > 50) {
      return { error: 'Add between 1 and 50 FAQ entries.' };
    }

    const value = normalizeSiteContentSection(section, draft);

    const invalidFaq = value.find((faq) => (
      faq.question.length < 5 || faq.question.length > 200 ||
      faq.answer.length < 10 || faq.answer.length > 2000 ||
      faq.keywords.length > 20 || faq.keywords.some((keyword) => keyword.length > 80)
    ));

    if (invalidFaq) {
      return { error: 'Each FAQ needs a 5–200 character question, a 10–2,000 character answer, and no more than 20 search phrases.' };
    }

    return { value };
  }

  if (!draft || !Array.isArray(draft.sections) || draft.sections.length < 1 || draft.sections.length > 30) {
    return { error: 'Add between 1 and 30 content sections.' };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.lastUpdated || '')) {
    return { error: 'Choose a valid Last updated date.' };
  }

  if (draft.lastUpdated > getLocalTodayKey()) {
    return { error: 'The Last updated date cannot be in the future.' };
  }

  const value = normalizeSiteContentSection(section, draft);

  const invalidSection = value.sections.find((item) => (
    item.title.length < 2 || item.title.length > 120 ||
    item.body.length > 4000 ||
    item.items.length > 50 ||
    item.items.some((listItem) => listItem.length > 500) ||
    (!item.body && item.items.length === 0)
  ));

  if (invalidSection) {
    return { error: 'Each section needs a title and either body text or at least one bullet. Check the field length limits.' };
  }

  return { value };
};

const AdminContentTab = ({ isAdmin, isSubAdmin, user }) => {
  const { content: approvedContent, error: contentLoadError, loading } = useSiteContent();
  const [selectedSection, setSelectedSection] = useState('faqs');
  const [draft, setDraft] = useState(() => cloneValue(approvedContent.faqs));
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestLoadError, setRequestLoadError] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState('');

  const selectedConfig = CONTENT_SECTIONS.find((section) => section.id === selectedSection);

  useEffect(() => {
    if (isDirty) return;
    setDraft(cloneValue(approvedContent[selectedSection]));
  }, [approvedContent, isDirty, selectedSection]);

  useEffect(() => {
    if (!user?.uid || (!isAdmin && !isSubAdmin)) return undefined;

    const requestsRef = collection(db, 'siteContentRequests');
    const requestsQuery = isAdmin
      ? requestsRef
      : query(requestsRef, where('requestedBy', '==', user.uid));

    return onSnapshot(
      requestsQuery,
      (snapshot) => {
        setRequests(snapshot.docs
          .map((requestDocument) => ({ id: requestDocument.id, ...requestDocument.data() }))
          .sort((first, second) => getTimestampMillis(second.requestedAt) - getTimestampMillis(first.requestedAt)));
        setRequestLoadError('');
      },
      (error) => {
        console.error('Unable to load content approval requests', error);
        setRequests([]);
        setRequestLoadError('Approval requests could not be loaded. Please retry this page.');
      },
    );
  }, [isAdmin, isSubAdmin, user?.uid]);

  const pendingRequestForSection = useMemo(() => requests.find((request) => (
    request.status === 'pending' &&
    request.section === selectedSection &&
    request.requestedBy === user?.uid
  )), [requests, selectedSection, user?.uid]);

  const visibleRequests = useMemo(() => (
    isAdmin ? requests.filter((request) => request.status === 'pending') : requests.slice(0, 8)
  ), [isAdmin, requests]);

  const updateDraft = (updater) => {
    setDraft((currentDraft) => updater(cloneValue(currentDraft)));
    setIsDirty(true);
    setStatusMessage(null);
  };

  const changeSection = (nextSection) => {
    if (nextSection === selectedSection) return;
    if (isDirty && !window.confirm('Discard the unsaved changes in this section?')) return;

    setSelectedSection(nextSection);
    setDraft(cloneValue(approvedContent[nextSection]));
    setIsDirty(false);
    setStatusMessage(null);
  };

  const resetDraft = () => {
    setDraft(cloneValue(approvedContent[selectedSection]));
    setIsDirty(false);
    setStatusMessage(null);
  };

  const moveItem = (index, direction) => {
    updateDraft((currentDraft) => {
      const list = selectedSection === 'faqs' ? currentDraft : currentDraft.sections;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= list.length) return currentDraft;
      [list[index], list[targetIndex]] = [list[targetIndex], list[index]];
      return currentDraft;
    });
  };

  const addItem = () => {
    updateDraft((currentDraft) => {
      if (selectedSection === 'faqs') {
        currentDraft.push({
          id: createContentItemId('faq'),
          question: '',
          answer: '',
          keywords: [],
        });
      } else {
        currentDraft.sections.push({
          id: createContentItemId(selectedSection),
          title: '',
          body: '',
          items: [],
        });
      }
      return currentDraft;
    });
  };

  const removeItem = (index) => {
    updateDraft((currentDraft) => {
      if (selectedSection === 'faqs') currentDraft.splice(index, 1);
      else currentDraft.sections.splice(index, 1);
      return currentDraft;
    });
  };

  const updateFaq = (index, field, value) => {
    updateDraft((currentDraft) => {
      currentDraft[index][field] = value;
      return currentDraft;
    });
  };

  const updateLegalSection = (index, field, value) => {
    updateDraft((currentDraft) => {
      currentDraft.sections[index][field] = value;
      return currentDraft;
    });
  };

  const notifyMainAdmins = async (sectionLabel) => {
    const adminSnapshot = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
    await createNotificationsForUsers({
      uids: adminSnapshot.docs.map((adminDocument) => adminDocument.id),
      type: 'content_approval',
      title: 'Content update approval requested',
      body: `${user?.email || 'A sub-admin'} submitted changes to ${sectionLabel}.`,
      link: '/?tab=content',
      subject: 'site_content',
    });
  };

  const saveDraft = async () => {
    const validation = validateContentDraft(selectedSection, draft);
    if (validation.error) {
      setStatusMessage({ tone: 'error', text: validation.error });
      return;
    }

    if (isSubAdmin && pendingRequestForSection) {
      setStatusMessage({ tone: 'error', text: `A ${selectedConfig.label} proposal is already waiting for main-admin review.` });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      if (isAdmin) {
        await setDoc(doc(db, 'settings', 'siteContent'), {
          [selectedSection]: validation.value,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
          updatedByEmail: user.email || '',
        }, { merge: true });
        setStatusMessage({ tone: 'success', text: `${selectedConfig.label} published successfully.` });
      } else {
        await addDoc(collection(db, 'siteContentRequests'), {
          section: selectedSection,
          content: validation.value,
          status: 'pending',
          requestedBy: user.uid,
          requestedByEmail: user.email || '',
          requestedAt: serverTimestamp(),
        });
        await notifyMainAdmins(selectedConfig.label);
        setStatusMessage({ tone: 'success', text: `${selectedConfig.label} changes were sent to the main admin for approval.` });
      }
      setDraft(cloneValue(validation.value));
      setIsDirty(false);
    } catch (error) {
      console.error('Unable to save managed site content', error);
      setStatusMessage({ tone: 'error', text: 'The content could not be saved. Please check your connection and try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const resolveRequest = async (request, decision) => {
    if (!isAdmin || processingRequestId) return;
    const validation = validateContentDraft(request.section, request.content);
    if (validation.error) {
      setStatusMessage({ tone: 'error', text: `This proposal cannot be ${decision}: ${validation.error}` });
      return;
    }

    const sectionLabel = CONTENT_SECTIONS.find((section) => section.id === request.section)?.label || 'site content';
    if (!window.confirm(`${decision === 'approved' ? 'Approve and publish' : 'Reject'} this ${sectionLabel} proposal?`)) return;

    setProcessingRequestId(request.id);
    setStatusMessage(null);

    try {
      if (decision === 'approved') {
        const batch = writeBatch(db);
        batch.set(doc(db, 'settings', 'siteContent'), {
          [request.section]: validation.value,
          updatedAt: serverTimestamp(),
          updatedBy: user.uid,
          updatedByEmail: user.email || '',
        }, { merge: true });
        batch.update(doc(db, 'siteContentRequests', request.id), {
          status: 'approved',
          reviewedBy: user.uid,
          reviewedAt: serverTimestamp(),
        });
        await batch.commit();
      } else {
        await updateDoc(doc(db, 'siteContentRequests', request.id), {
          status: 'rejected',
          reviewedBy: user.uid,
          reviewedAt: serverTimestamp(),
        });
      }

      await createNotification({
        uid: request.requestedBy,
        type: 'content_approval',
        title: `Content changes ${decision}`,
        body: `Your ${CONTENT_SECTIONS.find((section) => section.id === request.section)?.label || 'site content'} proposal was ${decision} by the main admin.`,
        link: '/?tab=content',
        subject: 'site_content',
      });
      setStatusMessage({ tone: 'success', text: `The proposal was ${decision}.` });
    } catch (error) {
      console.error('Unable to resolve content approval request', error);
      setStatusMessage({ tone: 'error', text: 'The proposal could not be resolved. Please try again.' });
    } finally {
      setProcessingRequestId('');
    }
  };

  if (loading) {
    return <div className="rounded-[1.5rem] bg-white/90 p-8 text-center text-artisan-text-muted">Loading approved content…</div>;
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/95 shadow-xl shadow-[#2D0E5A]/10">
        <div className="grid gap-5 bg-[radial-gradient(circle_at_top_right,rgba(118,72,179,0.14),transparent_38%)] p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-artisan-primary">Managed content</p>
            <h2 className="mt-2 font-nunito text-3xl font-bold tracking-tight text-artisan-text sm:text-4xl">Support and legal pages</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-artisan-text-muted sm:text-base">
              Edit public FAQs, Privacy Policy, and Terms of Service from one place. Approved FAQ changes also update the factual FAQ assistant.
            </p>
          </div>
          <div className={`rounded-2xl p-4 ${isAdmin ? 'bg-artisan-primary text-white' : 'border border-amber-200 bg-amber-50 text-amber-950'}`}>
            <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">Publishing access</p>
            <p className="mt-1 font-bold">{isAdmin ? 'Main admin · direct publishing' : 'Sub-admin · approval required'}</p>
            <p className="mt-2 text-sm opacity-75">{isAdmin ? 'Saved changes become public immediately.' : 'Changes stay private until a main admin approves them.'}</p>
          </div>
        </div>

        <div className="border-t border-artisan-primary/10 p-5 sm:p-7">
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Managed content sections">
            {CONTENT_SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selectedSection === id}
                onClick={() => changeSection(id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary ${selectedSection === id ? 'bg-artisan-primary text-white shadow-sm' : 'bg-artisan-primary-wash/50 text-artisan-text hover:bg-artisan-primary-wash'}`}
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {(contentLoadError || requestLoadError) && (
        <div role="alert" className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{contentLoadError || requestLoadError}</p>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.55fr)] xl:items-start">
        <section className="rounded-[1.5rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10 sm:p-6">
          <div className="flex flex-col gap-3 border-b border-artisan-primary/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-artisan-primary">Editing</p>
              <h3 className="mt-1 font-nunito text-2xl font-bold text-artisan-text">{selectedConfig.label}</h3>
            </div>
            {isDirty && <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">Unsaved changes</span>}
          </div>

          {pendingRequestForSection && isSubAdmin && (
            <div className="mt-5 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <Clock3 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>Your current {selectedConfig.label} proposal is waiting for main-admin review. Resolve it before submitting another proposal for this section.</p>
            </div>
          )}

          {selectedSection === 'faqs' ? (
            <div className="mt-5 space-y-4">
              {draft.map((faq, index) => (
                <article key={faq.id} className="rounded-2xl border border-artisan-primary/10 bg-artisan-primary-wash/20 p-4 sm:p-5">
                  <EditorCardHeader
                    label={`FAQ ${index + 1}`}
                    index={index}
                    count={draft.length}
                    onMove={moveItem}
                    onRemove={removeItem}
                  />
                  <label className="mt-4 block text-sm font-semibold text-artisan-text">
                    Question
                    <input
                      value={faq.question}
                      onChange={(event) => updateFaq(index, 'question', event.target.value)}
                      maxLength={200}
                      className="mt-2 h-11 w-full rounded-xl border border-artisan-border bg-white px-3 text-sm outline-none focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                    />
                  </label>
                  <label className="mt-4 block text-sm font-semibold text-artisan-text">
                    Answer
                    <textarea
                      value={faq.answer}
                      onChange={(event) => updateFaq(index, 'answer', event.target.value)}
                      maxLength={2000}
                      rows={5}
                      className="mt-2 w-full resize-y rounded-xl border border-artisan-border bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                    />
                  </label>
                  <label className="mt-4 block text-sm font-semibold text-artisan-text">
                    FAQ assistant search phrases <span className="font-normal text-artisan-text-muted">(one per line)</span>
                    <textarea
                      value={(faq.keywords || []).join('\n')}
                      onChange={(event) => updateFaq(index, 'keywords', event.target.value.split('\n'))}
                      rows={3}
                      className="mt-2 w-full resize-y rounded-xl border border-artisan-border bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                    />
                  </label>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <label className="block max-w-xs text-sm font-semibold text-artisan-text">
                Last updated
                <input
                  type="date"
                  value={draft.lastUpdated}
                  max={getLocalTodayKey()}
                  onChange={(event) => updateDraft((currentDraft) => ({ ...currentDraft, lastUpdated: event.target.value }))}
                  className="mt-2 h-11 w-full rounded-xl border border-artisan-border bg-white px-3 text-sm outline-none focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                />
              </label>
              {draft.sections.map((item, index) => (
                <article key={item.id} className="rounded-2xl border border-artisan-primary/10 bg-artisan-primary-wash/20 p-4 sm:p-5">
                  <EditorCardHeader
                    label={`Section ${index + 1}`}
                    index={index}
                    count={draft.sections.length}
                    onMove={moveItem}
                    onRemove={removeItem}
                  />
                  <label className="mt-4 block text-sm font-semibold text-artisan-text">
                    Heading
                    <input
                      value={item.title}
                      onChange={(event) => updateLegalSection(index, 'title', event.target.value)}
                      maxLength={120}
                      className="mt-2 h-11 w-full rounded-xl border border-artisan-border bg-white px-3 text-sm outline-none focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                    />
                  </label>
                  <label className="mt-4 block text-sm font-semibold text-artisan-text">
                    Paragraph
                    <textarea
                      value={item.body}
                      onChange={(event) => updateLegalSection(index, 'body', event.target.value)}
                      maxLength={4000}
                      rows={5}
                      className="mt-2 w-full resize-y rounded-xl border border-artisan-border bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                    />
                  </label>
                  <label className="mt-4 block text-sm font-semibold text-artisan-text">
                    Bullet points <span className="font-normal text-artisan-text-muted">(optional, one per line)</span>
                    <textarea
                      value={(item.items || []).join('\n')}
                      onChange={(event) => updateLegalSection(index, 'items', event.target.value.split('\n'))}
                      rows={4}
                      className="mt-2 w-full resize-y rounded-xl border border-artisan-border bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-artisan-primary focus:ring-2 focus:ring-artisan-primary/15"
                    />
                  </label>
                </article>
              ))}
            </div>
          )}

          <Button type="button" variant="outline" onClick={addItem} className="mt-5">
            <Plus size={17} className="mr-2" aria-hidden="true" />
            Add {selectedSection === 'faqs' ? 'FAQ' : 'section'}
          </Button>

          {statusMessage && (
            <div role="status" className={`mt-5 flex gap-2 rounded-xl border px-4 py-3 text-sm ${statusMessage.tone === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
              {statusMessage.tone === 'error' ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
              <p>{statusMessage.text}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-artisan-primary/10 pt-5 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={resetDraft} disabled={!isDirty || isSaving}>Discard changes</Button>
            <Button type="button" onClick={saveDraft} disabled={!isDirty || isSaving || Boolean(isSubAdmin && pendingRequestForSection)}>
              {isAdmin ? <Save size={17} className="mr-2" /> : <Send size={17} className="mr-2" />}
              {isSaving ? 'Saving…' : isAdmin ? 'Publish changes' : 'Submit for approval'}
            </Button>
          </div>
        </section>

        <aside className="rounded-[1.5rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-[#2D0E5A]/10 xl:sticky xl:top-32">
          <h3 className="font-nunito text-xl font-bold text-artisan-text">{isAdmin ? 'Pending approvals' : 'Your submissions'}</h3>
          <p className="mt-1 text-sm leading-6 text-artisan-text-muted">{isAdmin ? 'Review sub-admin proposals before they become public.' : 'Track recent content proposals and decisions.'}</p>

          <div className="mt-4 space-y-3">
            {visibleRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-artisan-primary/15 bg-artisan-primary-wash/25 px-4 py-6 text-center text-sm text-artisan-text-muted">
                {isAdmin ? 'No content proposals need review.' : 'You have not submitted content changes yet.'}
              </div>
            ) : visibleRequests.map((request) => {
              const requestConfig = CONTENT_SECTIONS.find((section) => section.id === request.section);
              const isProcessing = processingRequestId === request.id;
              return (
                <article key={request.id} className="rounded-xl border border-artisan-primary/10 bg-artisan-primary-wash/25 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-artisan-text">{requestConfig?.label || 'Site content'}</p>
                      <p className="mt-1 break-all text-xs text-artisan-text-muted">{request.requestedByEmail || 'Sub-admin'}</p>
                    </div>
                    <RequestStatus status={request.status} />
                  </div>
                  {request.requestedAt?.toDate && (
                    <p className="mt-2 text-xs text-artisan-text-muted">
                      Submitted {request.requestedAt.toDate().toLocaleString('en-PH')}
                    </p>
                  )}
                  {isAdmin && request.status === 'pending' && (
                    <>
                      <ProposalPreview request={request} />
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button type="button" size="sm" onClick={() => resolveRequest(request, 'approved')} disabled={Boolean(processingRequestId)}>
                          <CheckCircle2 size={15} className="mr-1.5" /> Approve
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => resolveRequest(request, 'rejected')} disabled={Boolean(processingRequestId)} className="border-red-200 text-red-700 hover:bg-red-50">
                          <XCircle size={15} className="mr-1.5" /> Reject
                        </Button>
                      </div>
                    </>
                  )}
                  {isProcessing && <p className="mt-2 text-xs font-semibold text-artisan-primary">Processing decision…</p>}
                </article>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
};

const EditorCardHeader = ({ count, index, label, onMove, onRemove }) => (
  <div className="flex items-center justify-between gap-3">
    <p className="text-sm font-bold text-artisan-primary">{label}</p>
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="icon" onClick={() => onMove(index, -1)} disabled={index === 0} aria-label={`Move ${label} up`}>
        <ArrowUp size={16} aria-hidden="true" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onMove(index, 1)} disabled={index === count - 1} aria-label={`Move ${label} down`}>
        <ArrowDown size={16} aria-hidden="true" />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(index)} className="text-red-700 hover:bg-red-50 hover:text-red-800" aria-label={`Remove ${label}`}>
        <Trash2 size={16} aria-hidden="true" />
      </Button>
    </div>
  </div>
);

const RequestStatus = ({ status }) => {
  const styles = {
    approved: 'bg-emerald-50 text-emerald-700',
    rejected: 'bg-red-50 text-red-700',
    pending: 'bg-amber-50 text-amber-800',
  };

  return <span className={`rounded-md px-2 py-1 text-xs font-bold capitalize ${styles[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
};

const ProposalPreview = ({ request }) => {
  const faqItems = Array.isArray(request.content) ? request.content : [];
  const legalSections = Array.isArray(request.content?.sections) ? request.content.sections : [];

  return (
    <details className="mt-4 rounded-lg border border-artisan-primary/10 bg-white/80 text-sm">
      <summary className="cursor-pointer px-3 py-2.5 font-semibold text-artisan-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-artisan-primary">
        Review proposed content
      </summary>
      <div className="max-h-80 space-y-3 overflow-y-auto border-t border-artisan-primary/10 p-3">
        {request.section === 'faqs' ? faqItems.map((faq, index) => (
          <div key={faq?.id || index} className="rounded-lg bg-artisan-primary-wash/30 p-3">
            <p className="font-semibold text-artisan-text">{faq?.question || `FAQ ${index + 1} has no question`}</p>
            <p className="mt-1 whitespace-pre-line text-xs leading-5 text-artisan-text-muted">{faq?.answer || 'No answer supplied.'}</p>
          </div>
        )) : (
          <>
            <p className="text-xs font-semibold text-artisan-text-muted">Last updated: {request.content?.lastUpdated || 'Not supplied'}</p>
            {legalSections.map((section, index) => (
              <div key={section?.id || index} className="rounded-lg bg-artisan-primary-wash/30 p-3">
                <p className="font-semibold text-artisan-text">{section?.title || `Section ${index + 1} has no heading`}</p>
                {section?.body && <p className="mt-1 whitespace-pre-line text-xs leading-5 text-artisan-text-muted">{section.body}</p>}
                {Array.isArray(section?.items) && section.items.length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-artisan-text-muted">
                    {section.items.map((item, itemIndex) => <li key={`${section?.id || index}-${itemIndex}`}>{item}</li>)}
                  </ul>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </details>
  );
};

export default AdminContentTab;
