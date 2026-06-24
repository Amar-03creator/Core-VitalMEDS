// pdfHelpers.js

export const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    let str = '';
    if (n >= 100) { str += ones[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
    if (n >= 20) { str += tens[Math.floor(n / 10)] + ' '; n %= 10; }
    else if (n >= 10) { str += teens[n - 10] + ' '; n = 0; }
    if (n > 0) str += ones[n] + ' ';
    return str;
  };

  if (num === 0) return 'Zero';
  let words = '';
  if (num >= 10000000) { words += convertLessThanThousand(Math.floor(num / 10000000)) + 'Crore '; num %= 10000000; }
  if (num >= 100000) { words += convertLessThanThousand(Math.floor(num / 100000)) + 'Lakh '; num %= 100000; }
  if (num >= 1000) { words += convertLessThanThousand(Math.floor(num / 1000)) + 'Thousand '; num %= 1000; }
  words += convertLessThanThousand(num);
  return words.trim() + ' Only';
};

export const formatPacking = (packing) => {
  if (!packing) return '';
  if (
    packing.includes("10'S Strip") ||
    packing.includes("10'S Tab") ||
    packing.includes("10'S Cap") ||
    packing.includes("10 Caps")
  ) return "10's";
  return packing;
};

export const formatExpiryForBill = (expiryDate) => {
  if (!expiryDate) return '';
  let d;
  if (expiryDate instanceof Date) {
    d = expiryDate;
  } else if (typeof expiryDate === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(expiryDate)) {
      d = new Date(expiryDate);
    } else if (/^\d{2}-\d{2}-\d{4}/.test(expiryDate)) {
      const [dd, mm, yyyy] = expiryDate.split('-');
      d = new Date(`${yyyy}-${mm}-${dd}`);
    } else {
      d = new Date(expiryDate);
    }
  }
  if (!d || isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}-${yy}`;
};

export const formatDateIndian = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

export const getPageSizes = (totalItems) => {
  if (totalItems <= 12) return [totalItems];
  if (totalItems <= 15) return [12, totalItems - 12];
  const sizes = [];
  let remaining = totalItems;
  while (remaining > 0) {
    if (remaining <= 12) { sizes.push(remaining); remaining = 0; }
    else { sizes.push(15); remaining -= 15; }
  }
  return sizes;
};