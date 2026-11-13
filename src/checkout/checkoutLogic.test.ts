import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidRollNumber,
  isValidIndianPhone,
  isValidUtrNumber,
  getDepartmentFromRoll,
  buildWhatsAppVerificationUrl,
  buildWhatsAppStudentPingUrl,
  STORE_UPI_ID,
  COORDINATOR_PHONE,
  HOSTELS_LIST,
} from './checkoutLogic';

test('STORE_UPI_ID and COORDINATOR_PHONE constants are properly defined', () => {
  assert.equal(STORE_UPI_ID, 'nitrrfie.store@sbi');
  assert.equal(COORDINATOR_PHONE, '917974766166');
  assert.ok(HOSTELS_LIST.length >= 10);
});

test('isValidRollNumber accepts valid NIT Raipur student patterns', () => {
  assert.equal(isValidRollNumber('21115042'), true);
  assert.equal(isValidRollNumber('22118001'), true);
  assert.equal(isValidRollNumber('23122099'), true);
  assert.equal(isValidRollNumber('EC-2026'), true);
  assert.equal(isValidRollNumber('TCP-HEAD'), true);
  assert.equal(isValidRollNumber('123'), false);
  assert.equal(isValidRollNumber(''), false);
});

test('isValidIndianPhone accepts standard 10-digit formats with prefixes', () => {
  assert.equal(isValidIndianPhone('9827103849'), true);
  assert.equal(isValidIndianPhone('+91 98271 03849'), true);
  assert.equal(isValidIndianPhone('09827103849'), true);
  assert.equal(isValidIndianPhone('919827103849'), true);
  assert.equal(isValidIndianPhone('5551234'), false);
  assert.equal(isValidIndianPhone('1234567890'), false); // Starts with 1
});

test('isValidUtrNumber accepts 12-digit UPI reference and banking IDs', () => {
  assert.equal(isValidUtrNumber('408219384910'), true);
  assert.equal(isValidUtrNumber('123456789012'), true);
  assert.equal(isValidUtrNumber('SBIN004819201'), true);
  assert.equal(isValidUtrNumber('BARB202602111'), true);
  assert.equal(isValidUtrNumber('123'), false);
  assert.equal(isValidUtrNumber(''), false);
});

test('getDepartmentFromRoll accurately extracts branch, batch and degree', () => {
  const cse = getDepartmentFromRoll('21115042');
  assert.equal(cse.branch, 'Computer Science & Engineering');
  assert.equal(cse.degree, 'B.Tech');
  assert.equal(cse.batch, '2021–2025');

  const arch = getDepartmentFromRoll('22121015');
  assert.equal(arch.branch, 'Architecture (B.Arch)');
  assert.equal(arch.degree, 'B.Arch');

  const it = getDepartmentFromRoll('23122005');
  assert.equal(it.branch, 'Information Technology');
  assert.equal(it.degree, 'B.Tech');
});

test('buildWhatsAppVerificationUrl creates properly formatted wa.me link with order token', () => {
  const url = buildWhatsAppVerificationUrl({
    id: 'NITRR-2026-88888',
    customerName: 'Aman Sharma',
    rollNumber: '21115042',
    phone: '9827103849',
    total: 2398,
    handoverType: 'makerspace_desk',
    utrNumber: '408219384910',
    items: [{ name: 'Varsity Bomber Jacket', quantity: 2 }],
  });

  assert.ok(url.startsWith('https://wa.me/917974766166?text='));
  assert.ok(url.includes(encodeURIComponent('NITRR-2026-88888')));
  assert.ok(url.includes(encodeURIComponent('408219384910')));
  assert.ok(url.includes(encodeURIComponent('Aman Sharma')));
  assert.ok(url.includes(encodeURIComponent('21115042')));
  assert.ok(url.includes(encodeURIComponent('9827103849')));
  assert.ok(url.includes(encodeURIComponent('Makerspace Desk (Ground Floor, Main Bldg)')));
  assert.ok(url.includes(encodeURIComponent('Varsity Bomber Jacket')));
  assert.ok(url.includes(encodeURIComponent('PAYMENT VERIFICATION')));
});

test('buildWhatsAppVerificationUrl supports manual verification without UTR', () => {
  const url = buildWhatsAppVerificationUrl({
    id: 'NITRR-2026-99999',
    customerName: 'Priya Verma',
    rollNumber: '22118012',
    phone: '9123456780',
    total: 1499,
    handoverType: 'hostel_delivery',
    items: [{ name: 'Campus Hoodie', quantity: 1 }],
  });

  assert.ok(url.includes(encodeURIComponent('NITRR-2026-99999')));
  assert.ok(url.includes(encodeURIComponent('Priya Verma')));
  assert.ok(url.includes(encodeURIComponent('22118012')));
  assert.ok(url.includes(encodeURIComponent('Hostel Handover')));
});

test('buildWhatsAppVerificationUrl supports home_delivery with customer address', () => {
  const url = buildWhatsAppVerificationUrl({
    id: 'NITRR-2026-77777',
    customerName: 'Rohit Sahu',
    rollNumber: '21115088',
    phone: '9827103849',
    total: 1999,
    handoverType: 'home_delivery',
    deliveryAddress: {
      addressLine: 'Flat 402, Sunshine Towers',
      city: 'Raipur',
      state: 'Chhattisgarh',
      pincode: '492010',
    },
    utrNumber: '408219384910',
    items: [{ name: 'Collegiate Hoodie', quantity: 1 }],
  });

  assert.ok(url.includes(encodeURIComponent('NITRR-2026-77777')));
  assert.ok(url.includes(encodeURIComponent('Flat 402, Sunshine Towers')));
  assert.ok(url.includes(encodeURIComponent('Raipur')));
});

test('buildWhatsAppVerificationUrl omits Roll / Batch when rollNumber is not provided', () => {
  const url = buildWhatsAppVerificationUrl({
    id: 'NITRR-2026-54321',
    customerName: 'Neha Kulkarni',
    phone: '9827103849',
    total: 1299,
    handoverType: 'makerspace_desk',
    items: [{ name: 'NITRR Hoodie', quantity: 1 }],
  });

  const decoded = decodeURIComponent(url);
  assert.ok(decoded.includes('Customer:* Neha Kulkarni'));
  assert.ok(!decoded.includes('Alumnus'));
  assert.ok(!decoded.includes('Roll / Batch'));
  assert.ok(!decoded.includes('ALUMNI / DIRECT'));
});

test('buildWhatsAppStudentPingUrl produces student status update link', () => {
  const url = buildWhatsAppStudentPingUrl({
    id: 'NITRR-2026-88888',
    customerName: 'Aman Sharma',
    phone: '9827103849',
    status: 'ready_for_handover',
    verificationStatus: 'desk_verified',
    utrNumber: '408219384910',
    handoverType: 'makerspace_desk',
  });

  assert.ok(url.startsWith('https://wa.me/919827103849?text='));
  assert.ok(url.includes(encodeURIComponent('NITRR-2026-88888')));
  assert.ok(url.includes(encodeURIComponent('READY for collection at Makerspace Desk')));
});

test('Rendered checkout sections contain clean placeholders, conditional delivery fields, and no alumni/roll fields or exposed coupons', async () => {
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { StudentDetailsSection } = await import('./components/StudentDetailsSection');
  const { CampusHandoverSection } = await import('./components/CampusHandoverSection');
  const { PaymentVerificationSection } = await import('./components/PaymentVerificationSection');
  const { ClearancePass } = await import('./components/ClearancePass');

  const noop = () => {};

  const studentHtml = renderToStaticMarkup(
    React.createElement(StudentDetailsSection, {
      customerName: '',
      setCustomerName: noop,
      email: '',
      setEmail: noop,
      phone: '',
      setPhone: noop,
      errors: {},
    })
  );

  assert.ok(studentHtml.includes('placeholder="Enter your full name"'));
  assert.ok(studentHtml.includes('placeholder="Enter your email address"'));
  assert.ok(studentHtml.includes('placeholder="Enter your mobile number"'));
  assert.ok(!/roll/i.test(studentHtml));
  assert.ok(!/alumni/i.test(studentHtml));
  assert.ok(!/batch/i.test(studentHtml));
  assert.ok(!/grad year/i.test(studentHtml));
  assert.ok(!/Aditya Verma|9827103849|e\.g\./i.test(studentHtml));

  const pickupHtml = renderToStaticMarkup(
    React.createElement(CampusHandoverSection, {
      handoverType: 'makerspace_desk',
      setHandoverType: noop,
      addressLine: '',
      setAddressLine: noop,
      city: '',
      setCity: noop,
      state: '',
      setState: noop,
      pincode: '',
      setPincode: noop,
      landmark: '',
      setLandmark: noop,
      errors: {},
    })
  );
  // Campus pickup must not render delivery address inputs
  assert.ok(!pickupHtml.includes('Enter your complete delivery address'));
  assert.ok(!pickupHtml.includes('Enter your PIN code'));
  assert.ok(!/alumni/i.test(pickupHtml));

  const deliveryHtml = renderToStaticMarkup(
    React.createElement(CampusHandoverSection, {
      handoverType: 'home_delivery',
      setHandoverType: noop,
      addressLine: '',
      setAddressLine: noop,
      city: '',
      setCity: noop,
      state: '',
      setState: noop,
      pincode: '',
      setPincode: noop,
      landmark: '',
      setLandmark: noop,
      errors: {},
    })
  );
  assert.ok(deliveryHtml.includes('placeholder="Enter your complete delivery address"'));
  assert.ok(deliveryHtml.includes('placeholder="Enter your city"'));
  assert.ok(deliveryHtml.includes('placeholder="Enter your state"'));
  assert.ok(deliveryHtml.includes('placeholder="Enter your PIN code"'));
  assert.ok(!/alumni|Palm Heights|492010|Chhattisgarh|e\.g\./i.test(deliveryHtml));

  const paymentHtml = renderToStaticMarkup(
    React.createElement(PaymentVerificationSection, {
      paymentMethod: 'upi_razorpay',
      setPaymentMethod: noop,
      utrNumber: '',
      setUtrNumber: noop,
      receiptImage: null,
      setReceiptImage: noop,
      totalAmount: 1499,
      customerName: '',
      errors: {},
      setErrors: noop,
      isPaymentVerified: false,
      onVerifyPayment: noop,
      onResetVerification: noop,
    })
  );
  assert.ok(paymentHtml.includes('placeholder="Enter 12-digit UPI UTR / Ref No."'));
  assert.ok(!/408219384910|e\.g\./i.test(paymentHtml));

  const passHtml = renderToStaticMarkup(
    React.createElement(ClearancePass, {
      order: {
        id: 'NITRR-2026-10001',
        createdAt: '2026-11-13T10:00:00.000Z',
        customerName: 'Neha Kulkarni',
        rollNumber: '',
        email: 'neha@example.com',
        phone: '9876543210',
        handoverType: 'makerspace_desk',
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            name: 'Official Varsity Jacket',
            color: 'Black',
            size: 'M',
            price: 1499,
            quantity: 1,
            image: '/assets/aistudio/ecell-varsity-jacket_daef387e.png',
          },
        ],
        subtotal: 1499,
        discountAmount: 0,
        handoverFee: 0,
        total: 1499,
        status: 'confirmed',
        paymentMethod: 'upi_razorpay',
        paymentStatus: 'pending_verification',
        verificationStatus: 'utr_submitted',
        utrNumber: '123456789012',
      },
      onNavigate: noop,
      onClearOrder: noop,
      whatsappDispatched: true,
      setWhatsappDispatched: noop,
    })
  );
  assert.ok(!/Alumni \/ Pan-India Patron|ALUMNI \/ DIRECT|Roll \/ Batch/i.test(passHtml));
});
