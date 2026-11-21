var test = require('node:test');
var assert = require('node:assert/strict');

var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');

test('order pricing applies HSN slab and coupon before tax', function () {
  var items = [
    { id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 2 }
  ];

  var orderFigures = pricing.computeTotals(items, 'WELCOME');

  assert.deepEqual(orderFigures, {
    subtotal: 200,
    discount: 10,
    taxable: 190,
    tax: 9.5,
    cgst: 4.75,
    sgst: 4.75,
    total: 199.5,
    lines: [{
      id: 1,
      name: 'Rice',
      hsn: '1006',
      gstPercent: 5,
      gross: 200,
      discount: 10,
      taxable: 190,
      tax: 9.5,
      net: 199.5
    }]
  });
});

test('invoice matches order pricing with HSN slabs and coupon discounts', function () {
  var order = {
    id: 7,
    items: [{ id: 1, name: 'Rice', hsn: '1006', price: 100, qty: 2 }],
    coupon: 'WELCOME',
    total: 199.5
  };

  var invoiceFigures = invoice.computeInvoiceFigures(order);

  assert.deepEqual(invoiceFigures, {
    subtotal: 200,
    discount: 10,
    tax: 9.5,
    cgst: 4.75,
    sgst: 4.75,
    total: 199.5,
    rows: [{
      name: 'Rice',
      sku: '-',
      hsn: '1006',
      qty: 2,
      price: 100,
      gstPercent: 5,
      line: 200,
      lineTax: 9.5
    }]
  });

  var rendered = invoice.render(order);
  assert.match(rendered, /Invoice Total<\/td><td class="r">₹199\.50/);
  assert.doesNotMatch(rendered, /Accountant Reconciliation Notice/);
});

test('invoice treats decimal gstRate values as decimal rates', function () {
  var figures = invoice.computeInvoiceFigures({
    items: [{ name: 'Tea', price: 100, qty: 1, gstRate: 0.05 }]
  });

  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.tax, 5);
  assert.equal(figures.total, 105);
});
