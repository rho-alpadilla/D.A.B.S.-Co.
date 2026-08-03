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

const buildOrderRows = (orders) => orders.flatMap((order) => getOrderItems(order).map((item) => {
  const quantity = Math.max(0, Math.floor(asNumber(item.quantity)));
  const unitPrice = asNumber(item.price);

  return {
    'Order ID': safeSpreadsheetText(order.id || 'Unknown'),
    'Order date': formatDateKey(order.createdAt) || 'Unavailable',
    Status: safeSpreadsheetText(order.status || 'Unspecified'),
    Product: safeSpreadsheetText(item.name || 'Unnamed product'),
    Quantity: quantity,
    'Unit price': unitPrice,
    'Line total': unitPrice * quantity,
    'Order total': asNumber(order.total),
  };
}));

export const downloadOrdersExcel = async ({ orders = [], startDate = '', endDate = '', productId = '' }) => {
  const { default: ExcelJS } = await import('exceljs');
  const filteredOrders = filterOrdersForExport({ orders, startDate, endDate, productId });
  const rows = buildOrderRows(filteredOrders);
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
    ['Order total', filteredOrders.reduce((total, order) => total + asNumber(order.total), 0)],
    [],
    ['Privacy notice', 'Shipping addresses and customer contact details are intentionally excluded.'],
  ]);
  summarySheet.columns = [{ width: 22 }, { width: 74 }];
  summarySheet.getCell('A1').font = { bold: true, size: 14, color: { argb: `FF${EXPORT_ACCENT}` } };
  summarySheet.getCell('B6').numFmt = '₱#,##0.00';

  const ordersSheet = workbook.addWorksheet('Orders');
  ordersSheet.columns = [
    { header: 'Order ID', key: 'Order ID', width: 26 },
    { header: 'Order date', key: 'Order date', width: 14 },
    { header: 'Status', key: 'Status', width: 24 },
    { header: 'Product', key: 'Product', width: 32 },
    { header: 'Quantity', key: 'Quantity', width: 10 },
    { header: 'Unit price', key: 'Unit price', width: 14 },
    { header: 'Line total', key: 'Line total', width: 14 },
    { header: 'Order total', key: 'Order total', width: 14 },
  ];
  const exportRows = rows.length ? rows : [{
    'Order ID': 'No orders match this export scope.',
    'Order date': '', Status: '', Product: '', Quantity: '', 'Unit price': '', 'Line total': '', 'Order total': '',
  }];
  ordersSheet.addRows(exportRows);
  ordersSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  ordersSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${EXPORT_ACCENT}` } };
  ordersSheet.autoFilter = { from: 'A1', to: 'H1' };
  ['F', 'G', 'H'].forEach((column) => {
    ordersSheet.getColumn(column).numFmt = '₱#,##0.00';
  });

  const fileBuffer = await workbook.xlsx.writeBuffer();
  const dateScope = `${safeFilePart(startDate || 'all-dates')}-to-${safeFilePart(endDate || 'today')}`;
  const productScope = productId ? `-product-${safeFilePart(productId)}` : '';
  downloadBlob(
    new Blob([fileBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `dabs-orders-${dateScope}${productScope}.xlsx`,
  );

  return { orderCount: filteredOrders.length, rowCount: rows.length };
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
