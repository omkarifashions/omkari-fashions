import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSettings } from './settingsService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO = path.resolve(__dirname, '../../assets/logo.png');
const BROWN = '#4a1d00';
const ORANGE = '#a84300';
const rs = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;
const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export async function buildInvoice(doc, order, user) {
  const s = await getSettings();
  const W = doc.page.width - 80;

  doc.rect(0, 0, doc.page.width, 96).fill(BROWN);
  if (fs.existsSync(LOGO)) doc.image(LOGO, 40, 14, { height: 68 });
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(22).text('Omkari Fashions', 120, 26);
  doc.font('Helvetica').fontSize(9).fillColor('#f1d9c7').text('Traditional Indian Jewellery - Since 1975', 120, 54);
  doc.font('Helvetica-Bold').fontSize(20).fillColor('#fff').text('INVOICE', 40, 34, { width: W, align: 'right' });

  doc.fillColor('#333').font('Helvetica').fontSize(10);
  let y = 116;
  doc.font('Helvetica-Bold').text('Invoice / Order No:', 40, y).font('Helvetica').text(order.orderNumber, 150, y);
  doc.font('Helvetica-Bold').text('Order Date:', 40, y + 16).font('Helvetica').text(fmt(order.createdAt), 150, y + 16);
  doc.font('Helvetica-Bold').text('Payment:', 40, y + 32).font('Helvetica').text(`${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'} - ${order.paymentStatus.replace('_', ' ')}`, 150, y + 32);

  const a = order.shippingAddress;
  doc.font('Helvetica-Bold').text('Ship To', 340, y);
  doc.font('Helvetica').text(`${a.name}\n${a.address}\n${a.city}, ${a.state} - ${a.pincode}\nPhone: ${a.phone}${user?.email ? `\n${user.email}` : ''}`, 340, y + 14, { width: 215 });

  y = 210;
  doc.rect(40, y, W, 24).fill(ORANGE);
  doc.fillColor('#fff').font('Helvetica-Bold').fontSize(10);
  doc.text('#', 48, y + 7).text('Item', 70, y + 7).text('SKU', 300, y + 7).text('Qty', 380, y + 7).text('Price', 420, y + 7).text('Amount', 490, y + 7);
  y += 30;
  doc.fillColor('#222').font('Helvetica').fontSize(10);
  order.items.forEach((it, i) => {
    if (y > 700) { doc.addPage(); y = 50; }
    doc.text(String(i + 1), 48, y).text(it.name, 70, y, { width: 220 }).text(it.sku || '-', 300, y, { width: 75 }).text(String(it.quantity), 380, y).text(rs(it.price), 420, y).text(rs(it.price * it.quantity), 490, y);
    y += 26;
    doc.moveTo(40, y - 6).lineTo(40 + W, y - 6).strokeColor('#ead6c8').lineWidth(0.5).stroke();
  });

  y += 10;
  const row = (label, val, bold) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 10).fillColor(bold ? BROWN : '#333');
    doc.text(label, 340, y).text(val, 440, y, { width: 115, align: 'right' });
    y += bold ? 22 : 16;
  };
  row('Subtotal', rs(order.subtotal));
  if (order.discount) row(`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`, `- ${rs(order.discount)}`);
  row('Shipping', order.shippingFee ? rs(order.shippingFee) : 'Free');
  row(`Tax included (${s.taxPercent}%)`, rs(order.tax));
  doc.moveTo(340, y).lineTo(555, y).strokeColor(BROWN).lineWidth(1).stroke();
  y += 6;
  row('Grand Total', rs(order.total), true);

  doc.font('Helvetica').fontSize(9).fillColor('#777').text('Prices are inclusive of all taxes. This is a computer generated invoice and does not require a signature.', 40, 760, { width: W, align: 'center' });
  doc.text(`${s.email}  |  ${s.phone}`, 40, 776, { width: W, align: 'center' });
}

export async function buildShippingLabel(doc, order) {
  const s = await getSettings();
  const W = doc.page.width - 32;
  doc.rect(8, 8, doc.page.width - 16, doc.page.height - 16).lineWidth(1.5).strokeColor('#000').stroke();
  if (fs.existsSync(LOGO)) doc.image(LOGO, 18, 16, { height: 40 });
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#000').text('Omkari Fashions', 66, 22);
  doc.font('Helvetica').fontSize(8).text(order.paymentMethod === 'cod' ? 'COD - COLLECT CASH' : 'PREPAID', 16, 24, { width: W, align: 'right' });
  doc.moveTo(8, 64).lineTo(doc.page.width - 8, 64).stroke();
  doc.font('Helvetica-Bold').fontSize(9).text('DELIVER TO', 18, 72);
  const a = order.shippingAddress;
  doc.font('Helvetica-Bold').fontSize(13).text(a.name, 18, 86);
  doc.font('Helvetica').fontSize(11).text(`${a.address}\n${a.city}, ${a.state}`, 18, 104, { width: W - 8 });
  doc.font('Helvetica-Bold').fontSize(18).text(`PIN: ${a.pincode}`, 18, 152);
  doc.font('Helvetica').fontSize(11).text(`Phone: ${a.phone}`, 18, 178);
  doc.moveTo(8, 200).lineTo(doc.page.width - 8, 200).stroke();
  doc.font('Helvetica-Bold').fontSize(9).text('ORDER', 18, 208);
  doc.font('Helvetica-Bold').fontSize(15).text(order.orderNumber, 18, 220);
  doc.font('Helvetica').fontSize(9).text(`Date: ${fmt(order.createdAt)}   Items: ${order.items.reduce((n, i) => n + i.quantity, 0)}`, 18, 242);
  if (order.trackingId) doc.text(`Courier: ${order.courier || '-'}   AWB: ${order.trackingId}`, 18, 256);
  if (order.paymentMethod === 'cod') doc.font('Helvetica-Bold').fontSize(16).text(`COD Amount: ${rs(order.total)}`, 18, 276);
  doc.moveTo(8, 306).lineTo(doc.page.width - 8, 306).stroke();
  doc.font('Helvetica-Bold').fontSize(8).text('RETURN ADDRESS', 18, 314);
  doc.font('Helvetica').fontSize(9).text(`Omkari Fashions\n${s.address || 'Andhra Pradesh, India'}\nPhone: ${s.phone}`, 18, 326, { width: W - 8 });
  doc.font('Helvetica').fontSize(7).fillColor('#555').text('Fragile - Handle with care - Jewellery', 18, 392, { width: W, align: 'center' });
}
