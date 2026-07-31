import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const MAX_MESSAGE_LENGTH = 3000;

export const sendSupportMessage = async ({
  user,
  name,
  email,
  subject,
  message,
  productInterest = 'None',
  source = 'contact-page',
  productId,
  productName,
  requestedQuantity,
}) => {
  const trimmedMessage = message?.trim();

  if (!user?.email) throw new Error('Please sign in before sending a message.');
  if (!trimmedMessage) throw new Error('Please enter a message for our team.');
  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) throw new Error(`Messages must be ${MAX_MESSAGE_LENGTH.toLocaleString()} characters or fewer.`);

  const payload = {
    buyerEmail: user.email || email,
    buyerName: name?.trim() || user.displayName || user.email.split('@')[0] || 'Buyer',
    subject: subject?.trim() || 'General Inquiry',
    message: trimmedMessage,
    status: 'unread',
    createdAt: serverTimestamp(),
    isAdminReply: false,
    source,
    productInterest,
  };

  if (productId) payload.productId = productId;
  if (productName) payload.productName = productName;
  if (requestedQuantity) payload.requestedQuantity = requestedQuantity;

  await addDoc(collection(db, 'messages'), payload);
};
