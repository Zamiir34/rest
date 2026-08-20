const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Inventory = require('../models/Inventory');
const Food = require('../models/Food');
const Employee = require('../models/Employee');
const Customer = require('../models/Customer');
const { getDateRange } = require('../services/dashboardService');

const getReportData = async (type, period) => {
  const { start, end } = getDateRange(period);
  const dateFilter = { createdAt: { $gte: start, $lte: end } };

  switch (type) {
    case 'sales':
      return Payment.find({ ...dateFilter, status: 'completed' }).populate('order');
    case 'orders':
      return Order.find(dateFilter).populate('table items.food');
    case 'inventory':
      return Inventory.find({ isActive: true }).populate('supplier');
    case 'food':
      return Food.find().populate('category');
    case 'employee':
      return Employee.find({ isActive: true }).populate('user', 'name email role');
    case 'customer':
      return Customer.find(dateFilter);
    default:
      return [];
  }
};

exports.generateReport = asyncHandler(async (req, res) => {
  const { type = 'sales', period = 'monthly', format = 'json' } = req.query;
  const data = await getReportData(type, period);

  if (format === 'json') {
    return res.json({ success: true, data, meta: { type, period, count: data.length } });
  }

  if (format === 'csv') {
    const rows = data.map((item) => JSON.stringify(item));
    const csv = rows.join('\n');
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename=${type}-report.csv`);
    return res.send(csv);
  }

  if (format === 'excel') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(`${type} Report`);
    if (data.length > 0) {
      const keys = Object.keys(data[0].toObject ? data[0].toObject() : data[0]);
      sheet.addRow(keys);
      data.forEach((item) => {
        const obj = item.toObject ? item.toObject() : item;
        sheet.addRow(keys.map((k) => JSON.stringify(obj[k] ?? '')));
      });
    }
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.set('Content-Disposition', `attachment; filename=${type}-report.xlsx`);
    await workbook.xlsx.write(res);
    return;
  }

  if (format === 'pdf') {
    const doc = new PDFDocument();
    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename=${type}-report.pdf`);
    doc.pipe(res);
    doc.fontSize(18).text(`${type.toUpperCase()} Report (${period})`, { align: 'center' });
    doc.moveDown();
    data.slice(0, 50).forEach((item, i) => {
      doc.fontSize(10).text(`${i + 1}. ${JSON.stringify(item.toObject ? item.toObject() : item).slice(0, 120)}...`);
    });
    doc.end();
    return;
  }

  res.json({ success: true, data });
});
