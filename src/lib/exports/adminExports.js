import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const EXPORT_ACCENT = '5C2D91';
const EXPORT_INK = '01243A';

const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatDateKey = (value) => {
  if (!value) return '';
  if (typeof value?.toDate === 'function') return formatDateKey(value.toDate());
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return '';
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof value?.seconds === 'number') return formatDateKey(new Date(value.seconds * 1000));

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : '';
};

const getBoundary = (value, endOfDay = false) => {
  if (!value) return null;
  const parsed = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

const getOrderDate = (order) => {
  const value = order?.createdAt;
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value?.seconds === 'number') return new Date(value.seconds * 1000);

  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

const safeSpreadsheetText = (value) => {
  const text = String(value ?? '').trim();
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
};

const safeFilePart = (value) => String(value || 'all').replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'all';

const getOrderItems = (order) => {
  if (!Array.isArray(order?.items) || order.items.length === 0) {
    return [{ id: '', productId: '', name: 'Item details unavailable', quantity: 0, price: 0 }];
  }

  return order.items;
};

const formatDateTime = (value) => {
  if (!value) return 'Unavailable';
  const date = typeof value?.toDate === 'function'
    ? value.toDate()
    : value instanceof Date
      ? value
      : typeof value?.seconds === 'number'
        ? new Date(value.seconds * 1000)
        : new Date(value);

  return Number.isFinite(date.getTime())
    ? date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Unavailable';
};

const getShippingAddress = (shippingInfo = {}) => (
  [
    shippingInfo.street,
    shippingInfo.city,
    shippingInfo.stateProvince,
    shippingInfo.postalCode,
    shippingInfo.country,
  ].filter(Boolean).join(', ') || 'Not provided'
);

const getRecipient = (order) => {
  const shippingInfo = order?.shippingInfo || {};
  return `${shippingInfo.firstName || ''} ${shippingInfo.lastName || ''}`.trim()
    || order?.buyerName
    || 'Not provided';
};

const getCustomerDetails = (order) => {
  const shippingInfo = order?.shippingInfo || {};
  return {
    customerName: order?.buyerName || getRecipient(order),
    email: shippingInfo.email || order?.buyerEmail || 'Not provided',
    phone: shippingInfo.phone || 'Not provided',
    recipient: getRecipient(order),
    address: getShippingAddress(shippingInfo),
  };
};

const itemMatchesProduct = (item, productId) => (
  String(item?.id || '') === productId || String(item?.productId || '') === productId
);

export const filterOrdersForExport = ({ orders = [], startDate = '', endDate = '', productId = '' }) => {
  const start = getBoundary(startDate);
  const end = getBoundary(endDate, true);

  return orders.filter((order) => {
    const orderDate = getOrderDate(order);
    if (start && (!orderDate || orderDate < start)) return false;
    if (end && (!orderDate || orderDate > end)) return false;
    if (productId && !getOrderItems(order).some((item) => itemMatchesProduct(item, productId))) return false;
    return true;
  });
};

const buildOrderSummaryRows = (orders) => orders.map((order) => {
  const customer = getCustomerDetails(order);

  return {
    'Order ID': safeSpreadsheetText(order.id || 'Unknown'),
    'Created date and time': formatDateTime(order.createdAt),
    Status: safeSpreadsheetText(order.status || 'Unspecified'),
    Customer: safeSpreadsheetText(customer.customerName),
    'Customer email': safeSpreadsheetText(customer.email),
    'Customer phone': safeSpreadsheetText(customer.phone),
    Recipient: safeSpreadsheetText(customer.recipient),
    'Shipping address': safeSpreadsheetText(customer.address),
    Delivery: safeSpreadsheetText(order.deliveryMethod || 'Not specified'),
    Payment: safeSpreadsheetText(order.paymentMethod || 'Not specified'),
    'Individual order total': asNumber(order.total),
  };
});

const buildOrderItemRows = (orders) => orders.flatMap((order) => getOrderItems(order).map((item) => {
  const quantity = Math.max(0, Math.floor(asNumber(item.quantity)));
  const unitPrice = asNumber(item.price);

  return {
    'Order ID': safeSpreadsheetText(order.id || 'Unknown'),
    Product: safeSpreadsheetText(item.name || 'Unnamed product'),
    Quantity: quantity,
    'Unit price': unitPrice,
    'Line total': unitPrice * quantity,
  };
}));

const getAuditOrder = (audit) => ({
  ...(audit?.orderSnapshot || {}),
  id: audit?.orderId || 'Unknown',
  status: audit?.previousStatus || 'Unknown',
});

const getAuditScopeDate = (audit) => getOrderDate(audit?.orderSnapshot || {}) || (
  typeof audit?.occurredAt?.toDate === 'function'
    ? audit.occurredAt.toDate()
    : typeof audit?.occurredAt?.seconds === 'number'
      ? new Date(audit.occurredAt.seconds * 1000)
      : null
);

const filterDeletionAuditsForExport = ({ audits = [], startDate = '', endDate = '', productId = '' }) => {
  const start = getBoundary(startDate);
  const end = getBoundary(endDate, true);

  return audits.filter((audit) => {
    const scopeDate = getAuditScopeDate(audit);
    if (start && (!scopeDate || scopeDate < start)) return false;
    if (end && (!scopeDate || scopeDate > end)) return false;
    if (productId && !getOrderItems(audit.orderSnapshot).some((item) => itemMatchesProduct(item, productId))) return false;
    return true;
  });
};

const buildDeletionAuditRows = (audits) => audits.map((audit) => {
  const order = getAuditOrder(audit);
  const customer = getCustomerDetails(order);

  return {
    'Order ID': safeSpreadsheetText(audit.orderId || 'Unknown'),
    Action: safeSpreadsheetText(audit.action || 'permanently_deleted'),
    'Original status': safeSpreadsheetText(audit.previousStatus || 'Unknown'),
    'Created date and time': formatDateTime(order.createdAt),
    'Deleted date and time': formatDateTime(audit.occurredAt),
    'Deleted by (UID)': safeSpreadsheetText(audit.actorUid || 'Not retained'),
    Reason: safeSpreadsheetText(audit.reason || 'Not retained'),
    Customer: safeSpreadsheetText(customer.customerName),
    'Customer email': safeSpreadsheetText(customer.email),
    'Customer phone': safeSpreadsheetText(customer.phone),
    Recipient: safeSpreadsheetText(customer.recipient),
    'Shipping address': safeSpreadsheetText(customer.address),
    Delivery: safeSpreadsheetText(order.deliveryMethod || 'Not retained'),
    Payment: safeSpreadsheetText(order.paymentMethod || 'Not retained'),
    'Original order total': asNumber(order.total),
    'Products and quantities': safeSpreadsheetText(getOrderItems(order)
      .map((item) => `${item.name || 'Unnamed product'} x${Math.max(0, Math.floor(asNumber(item.quantity)))}`)
      .join('; ') || 'Not retained'),
    'Record detail': audit.orderSnapshot ? 'Full operational snapshot retained' : 'Historical audit only',
  };
});

const loadPermanentDeletionAudits = async () => {
  const auditCollections = [
    'orderDeletionAudits',
    'recycleBinDeletionAudits',
    'activeOrderDeletionAudits',
  ];
  const snapshots = await Promise.all(auditCollections.map((name) => getDocs(collection(db, name))));

  return snapshots.flatMap((snapshot, index) => snapshot.docs.map((auditDocument) => ({
    id: auditDocument.id,
    auditCollection: auditCollections[index],
    ...auditDocument.data(),
  })));
};

const styleSheetHeader = (sheet, lastColumn) => {
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${EXPORT_ACCENT}` } };
  sheet.autoFilter = { from: 'A1', to: `${lastColumn}1` };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
};

export const downloadOrdersExcel = async ({ orders = [], startDate = '', endDate = '', productId = '' }) => {
  const { default: ExcelJS } = await import('exceljs');
  const filteredOrders = filterOrdersForExport({ orders, startDate, endDate, productId });
  const deletionAudits = filterDeletionAuditsForExport({
    audits: await loadPermanentDeletionAudits(),
    startDate,
    endDate,
    productId,
  });
  const orderRows = buildOrderSummaryRows(filteredOrders);
  const itemRows = buildOrderItemRows(filteredOrders);
  const deletionRows = buildDeletionAuditRows(deletionAudits);
  const orderTotal = filteredOrders.reduce((total, order) => total + asNumber(order.total), 0);
  const deletedOrderTotal = deletionAudits.reduce((total, audit) => total + asNumber(audit.orderSnapshot?.total), 0);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'D.A.B.S. Co.';
  workbook.created = new Date();
  const filterLabel = productId ? `Product ${productId}` : 'All products';
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.addRows([
    ['D.A.B.S. Co. order export'],
    ['Generated', new Date().toLocaleString()],
    ['Date range', `${startDate || 'Earliest'} to ${endDate || 'Today'}`],
    ['Product filter', filterLabel],
    ['Orders included', filteredOrders.length],
    ['Grand order total', orderTotal],
    ['Permanent deletion audit entries', deletionAudits.length],
    ['Deleted-order total retained in snapshots', deletedOrderTotal],
    [],
    ['Privacy notice', 'Contains customer and shipping details for main-admin operational use. Store and share this file securely.'],
    ['Historical deletion note', 'Deletion audits created before snapshot support contain only the immutable audit details available at that time.'],
  ]);
  summarySheet.columns = [{ width: 22 }, { width: 74 }];
  summarySheet.getCell('A1').font = { bold: true, size: 14, color: { argb: `FF${EXPORT_ACCENT}` } };
  summarySheet.getCell('B6').numFmt = '₱#,##0.00';

  summarySheet.getCell('B8').numFmt = summarySheet.getCell('B6').numFmt;

  const ordersSheet = workbook.addWorksheet('Orders');
  ordersSheet.columns = [
    { header: 'Order ID', key: 'Order ID', width: 26 },
    { header: 'Created date and time', key: 'Created date and time', width: 24 },
    { header: 'Status', key: 'Status', width: 24 },
    { header: 'Customer', key: 'Customer', width: 24 },
    { header: 'Customer email', key: 'Customer email', width: 30 },
    { header: 'Customer phone', key: 'Customer phone', width: 20 },
    { header: 'Recipient', key: 'Recipient', width: 24 },
    { header: 'Shipping address', key: 'Shipping address', width: 48 },
    { header: 'Delivery', key: 'Delivery', width: 18 },
    { header: 'Payment', key: 'Payment', width: 18 },
    { header: 'Individual order total', key: 'Individual order total', width: 20 },
  ];
  const exportRows = orderRows.length ? orderRows : [{
    'Order ID': 'No orders match this export scope.',
    'Created date and time': '', Status: '', Customer: '', 'Customer email': '', 'Customer phone': '', Recipient: '', 'Shipping address': '', Delivery: '', Payment: '', 'Individual order total': '',
  }];
  ordersSheet.addRows(exportRows);
  ordersSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ordersSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${EXPORT_ACCENT}` } };
  ordersSheet.autoFilter = { from: 'A1', to: 'K1' };
  ['K'].forEach((column) => {
    ordersSheet.getColumn(column).numFmt = '₱#,##0.00';
  });

  const itemsSheet = workbook.addWorksheet('Order Items');
  itemsSheet.columns = [
    { header: 'Order ID', key: 'Order ID', width: 26 },
    { header: 'Product', key: 'Product', width: 36 },
    { header: 'Quantity', key: 'Quantity', width: 12 },
    { header: 'Unit price', key: 'Unit price', width: 16 },
    { header: 'Line total', key: 'Line total', width: 16 },
  ];
  itemsSheet.addRows(itemRows.length ? itemRows : [{
    'Order ID': 'No order items match this export scope.', Product: '', Quantity: '', 'Unit price': '', 'Line total': '',
  }]);
  styleSheetHeader(itemsSheet, 'E');
  ['D', 'E'].forEach((column) => { itemsSheet.getColumn(column).numFmt = ordersSheet.getColumn('K').numFmt; });

  const deletedSheet = workbook.addWorksheet('Permanent Deletions');
  deletedSheet.columns = [
    { header: 'Order ID', key: 'Order ID', width: 26 },
    { header: 'Action', key: 'Action', width: 36 },
    { header: 'Original status', key: 'Original status', width: 22 },
    { header: 'Created date and time', key: 'Created date and time', width: 24 },
    { header: 'Deleted date and time', key: 'Deleted date and time', width: 24 },
    { header: 'Deleted by (UID)', key: 'Deleted by (UID)', width: 32 },
    { header: 'Reason', key: 'Reason', width: 44 },
    { header: 'Customer', key: 'Customer', width: 24 },
    { header: 'Customer email', key: 'Customer email', width: 30 },
    { header: 'Customer phone', key: 'Customer phone', width: 20 },
    { header: 'Recipient', key: 'Recipient', width: 24 },
    { header: 'Shipping address', key: 'Shipping address', width: 48 },
    { header: 'Delivery', key: 'Delivery', width: 18 },
    { header: 'Payment', key: 'Payment', width: 18 },
    { header: 'Original order total', key: 'Original order total', width: 20 },
    { header: 'Products and quantities', key: 'Products and quantities', width: 48 },
    { header: 'Record detail', key: 'Record detail', width: 28 },
  ];
  deletedSheet.addRows(deletionRows.length ? deletionRows : [{
    'Order ID': 'No permanent deletions match this export scope.', Action: '', 'Original status': '', 'Created date and time': '', 'Deleted date and time': '', 'Deleted by (UID)': '', Reason: '', Customer: '', 'Customer email': '', 'Customer phone': '', Recipient: '', 'Shipping address': '', Delivery: '', Payment: '', 'Original order total': '', 'Products and quantities': '', 'Record detail': '',
  }]);
  styleSheetHeader(deletedSheet, 'Q');
  deletedSheet.getColumn('O').numFmt = ordersSheet.getColumn('K').numFmt;

  const fileBuffer = await workbook.xlsx.writeBuffer();
  const dateScope = `${safeFilePart(startDate || 'all-dates')}-to-${safeFilePart(endDate || 'today')}`;
  const productScope = productId ? `-product-${safeFilePart(productId)}` : '';
  downloadBlob(
    new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `dabs-orders-${dateScope}${productScope}.xlsx`,
  );

  return {
    orderCount: filteredOrders.length,
    rowCount: itemRows.length,
    deletionAuditCount: deletionAudits.length,
  };
};

const formatCurrency = (value) => new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
}).format(asNumber(value));

const formatNumber = (value) => new Intl.NumberFormat('en-PH').format(asNumber(value));

const metricTable = ({ AlignmentType, Paragraph, Table, TableCell, TableRow, TextRun, WidthType }, rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: rows.map(([label, value]) => new TableRow({
    children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, color: EXPORT_INK })] })] }),
      new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: value, color: EXPORT_INK })] })] }),
    ],
  })),
});

const bullet = ({ Paragraph }, text) => new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 90 } });

const sectionHeading = ({ HeadingLevel, Paragraph }, text) => new Paragraph({
  text,
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 260, after: 110 },
});

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const downloadAnalyticsWordReport = async ({
  customEndDate = '',
  customStartDate = '',
  descriptiveAnalytics,
  diagnosticAnalytics,
  forecast,
  prescriptiveRecommendations = [],
}) => {
  const docx = await import('docx');
  const {
    AlignmentType,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    WidthType,
  } = docx;
  const scope = customStartDate || customEndDate
    ? `${customStartDate || 'earliest available date'} to ${customEndDate || 'today'}`
    : 'all recorded completed orders';
  const topProducts = descriptiveAnalytics.topProducts.slice(0, 5);
  const document = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children: [
        new Paragraph({ children: [new TextRun({ text: 'D.A.B.S. Co. analytics report', bold: true, color: EXPORT_ACCENT, size: 34 })], spacing: { after: 90 } }),
        new Paragraph({ children: [new TextRun({ text: `Scope: ${scope}`, color: EXPORT_INK })], spacing: { after: 60 } }),
        new Paragraph({ children: [new TextRun({ text: `Generated locally: ${new Date().toLocaleString()}`, color: '4B5563', italics: true })], spacing: { after: 220 } }),
        sectionHeading({ HeadingLevel, Paragraph }, 'Descriptive: what happened'),
        metricTable({ AlignmentType, Paragraph, Table, TableCell, TableRow, TextRun, WidthType }, [
          ['Completed revenue', formatCurrency(descriptiveAnalytics.totalRevenue)],
          ['Completed orders', formatNumber(descriptiveAnalytics.completedOrderCount)],
          ['Average order value', formatCurrency(descriptiveAnalytics.averageOrderValue)],
          ['Best-seller units', formatNumber(descriptiveAnalytics.bestSellerUnits)],
        ]),
        new Paragraph({ text: 'Top products', heading: HeadingLevel.HEADING_3, spacing: { before: 180, after: 70 } }),
        ...(topProducts.length ? topProducts.map((product) => bullet({ Paragraph }, `${product.name}: ${formatNumber(product.totalSold)} sold, ${formatCurrency(product.revenue)} completed-order revenue.`)) : [new Paragraph({ text: 'No completed product sales in this scope.' })]),
        sectionHeading({ HeadingLevel, Paragraph }, 'Diagnostic: what may have contributed'),
        ...(diagnosticAnalytics?.isAvailable
          ? [
            metricTable({ AlignmentType, Paragraph, Table, TableCell, TableRow, TextRun, WidthType }, [
              ['Revenue change', formatCurrency(diagnosticAnalytics.metrics.revenue.change)],
              ['Completed-order change', formatNumber(diagnosticAnalytics.metrics.orderCount.change)],
              ['Average-order-value change', formatCurrency(diagnosticAnalytics.metrics.averageOrderValue.change)],
              ['Exception-order change', formatNumber(diagnosticAnalytics.metrics.exceptions.change)],
            ]),
            ...(diagnosticAnalytics.contributors.length ? diagnosticAnalytics.contributors.map((item) => bullet({ Paragraph }, item.description)) : [new Paragraph({ text: 'No evidence-based contributors were found for this comparison.' })]),
          ]
          : [new Paragraph({ text: diagnosticAnalytics?.reason || 'Select a complete date range to compare this period with the previous period.' })]),
        sectionHeading({ HeadingLevel, Paragraph }, 'Predictive: what might happen next'),
        ...(forecast?.isAvailable
          ? [
            metricTable({ AlignmentType, Paragraph, Table, TableCell, TableRow, TextRun, WidthType }, [
              [`${forecast.horizonDays}-day revenue estimate`, formatCurrency(forecast.projectedRevenue)],
              ['Estimated daily average', formatCurrency(forecast.projectedDailyAverage)],
              ['Trend', forecast.trendDirection],
              ['Confidence guidance', forecast.confidence.level],
            ]),
            new Paragraph({ text: forecast.confidence.detail, spacing: { before: 100 } }),
            new Paragraph({ text: `Method and limits: ${forecast.method}`, spacing: { before: 90 } }),
          ]
          : [new Paragraph({ text: forecast?.reason || 'Forecast is not ready for the selected data.' })]),
        sectionHeading({ HeadingLevel, Paragraph }, 'Prescriptive: recommended next steps'),
        ...(prescriptiveRecommendations.length ? prescriptiveRecommendations.map((item) => bullet({ Paragraph }, `${item.title}: ${item.description}`)) : [new Paragraph({ text: 'No recommendations are available for this scope.' })]),
        new Paragraph({ children: [new TextRun({ text: 'Privacy: this report excludes shipping addresses and customer contact details.', italics: true, color: '4B5563' })], spacing: { before: 260 } }),
      ],
    }],
  });

  const blob = await Packer.toBlob(document);
  const dateScope = `${safeFilePart(customStartDate || 'all-dates')}-to-${safeFilePart(customEndDate || 'today')}`;
  downloadBlob(blob, `dabs-analytics-${dateScope}.docx`);
};
