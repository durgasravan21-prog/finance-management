import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment variables or localStorage
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('supabase_url') || '';
let supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('supabase_anon_key') || '';

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e);
  }
}

export const isDbConnected = () => !!supabase;

export const getCredentials = () => ({ url: supabaseUrl, key: supabaseKey });

export const setCredentials = (url, key) => {
  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_anon_key', key);
  supabaseUrl = url;
  supabaseKey = key;
  if (url && key) {
    try {
      supabase = createClient(url, key);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      supabase = null;
    }
  } else {
    supabase = null;
  }
};

// --- DATA MAPPINGS ---
function mapBorrowerFromDb(b) {
  return {
    id: b.id,
    name: b.name,
    phone: b.phone,
    email: b.email || '',
    address: b.address || '',
    village: b.village || '',
    upiVpa: b.upi_vpa || '',
    isActive: b.is_active,
    photo: b.photo || '',
    document: b.document || '',
    collectionDay: b.collection_day || 'Any Day'
  };
}

function mapBorrowerToDb(b) {
  return {
    name: b.name,
    phone: b.phone,
    email: b.email || '',
    address: b.address || '',
    village: b.village || '',
    upi_vpa: b.upiVpa || '',
    is_active: b.isActive,
    photo: b.photo || '',
    document: b.document || '',
    collection_day: b.collectionDay || 'Any Day'
  };
}

// --- UPI Auto Payment mappings ---
function mapUpiPaymentFromDb(p) {
  return {
    id: p.id,
    borrowerId: p.borrower_id,
    amount: parseFloat(p.amount),
    upiVpa: p.upi_vpa,
    bankSmsText: p.bank_sms_text,
    detectedAt: p.detected_at,
    status: p.status,
    linkedRepaymentId: p.linked_repayment_id
  };
}

function mapUpiPaymentToDb(p) {
  return {
    borrower_id: p.borrowerId || null,
    amount: p.amount,
    upi_vpa: p.upiVpa,
    bank_sms_text: p.bankSmsText,
    status: p.status || 'PENDING',
    linked_repayment_id: p.linkedRepaymentId || null
  };
}

function mapLoanFromDb(l) {
  const principal = parseFloat(l.principal);
  const tenure = parseInt(l.tenure);
  const cycleType = l.cycle_type || l.cycleType || 'MONTHLY';
  
  let repaymentAmount = l.repayment_amount !== undefined ? l.repayment_amount : l.repaymentAmount;
  repaymentAmount = repaymentAmount ? parseFloat(repaymentAmount) : null;
  
  if (!repaymentAmount) {
    // Backwards compatibility calculation
    const rateVal = parseFloat(l.rate) || 2.0;
    const rm = rateVal / 100;
    repaymentAmount = Math.round(principal * rm * Math.pow(1 + rm, tenure) / (Math.pow(1 + rm, tenure) - 1));
  }

  return {
    id: l.id,
    borrowerId: l.borrower_id || l.borrowerId,
    principal,
    rate: parseFloat(l.rate || 0),
    tenure,
    startDate: l.start_date || l.startDate,
    dueDate: l.due_date || l.dueDate,
    status: l.status,
    collateral: l.collateral || '',
    notes: l.notes || '',
    cycleType,
    repaymentAmount,
    repaymentSchedule: []
  };
}

function mapLoanToDb(l) {
  return {
    borrower_id: l.borrowerId,
    principal: l.principal,
    rate: l.rate || 0,
    tenure: l.tenure,
    start_date: l.startDate,
    due_date: l.dueDate,
    status: l.status,
    collateral: l.collateral || '',
    notes: l.notes || '',
    cycle_type: l.cycleType || 'MONTHLY',
    repayment_amount: l.repaymentAmount
  };
}

function mapRepaymentFromDb(r) {
  return {
    id: r.id,
    loanId: r.loan_id,
    borrowerId: r.borrower_id,
    amount: parseFloat(r.amount),
    paidOn: r.paid_on,
    method: r.method,
    notes: r.notes || '',
    receipt: r.receipt,
    receiptImage: r.receipt_image || ''
  };
}

function mapRepaymentToDb(r) {
  return {
    loan_id: r.loanId,
    borrower_id: r.borrowerId,
    amount: r.amount,
    paid_on: r.paidOn,
    method: r.method,
    notes: r.notes || '',
    receipt: r.receipt,
    receipt_image: r.receiptImage || ''
  };
}

function mapMessageFromDb(m) {
  return {
    id: m.id,
    borrowerId: m.borrower_id,
    content: m.content,
    sentAt: m.sent_at,
    direction: m.direction
  };
}

function mapMessageToDb(m) {
  return {
    borrower_id: m.borrowerId,
    content: m.content,
    sent_at: m.sentAt,
    direction: m.direction
  };
}

// --- LOCAL STORAGE PERSISTENCE (OFFLINE FALLBACK) ---
const saveLocal = (key, data) => localStorage.setItem(`lb_${key}`, JSON.stringify(data));

let localBorrowers = JSON.parse(localStorage.getItem('lb_borrowers')) || [];

let localLoans = JSON.parse(localStorage.getItem('lb_loans')) || [];

let localRepayments = JSON.parse(localStorage.getItem('lb_repayments')) || [];

let localMsgs = JSON.parse(localStorage.getItem('lb_msgs')) || [];

let localUpiPayments = JSON.parse(localStorage.getItem('lb_upi_payments')) || [];
let localRawSms = JSON.parse(localStorage.getItem('lb_raw_sms')) || [];

// --- DB INTERFACE METHODS ---

// Borrowers
export async function getBorrowers() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('borrowers').select('*').order('id', { ascending: true });
      if (!error) return data.map(mapBorrowerFromDb);
      console.error('Supabase fetch borrowers error:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }
  return localBorrowers;
}

export async function addBorrower(b) {
  if (supabase) {
    const { data, error } = await supabase.from('borrowers').insert([mapBorrowerToDb(b)]).select();
    if (error) {
      console.error('Supabase add borrower error:', error);
      throw new Error(error.message || 'Failed to add borrower');
    }
    if (data && data.length > 0) return mapBorrowerFromDb(data[0]);
  }
  const newB = { ...b, id: localBorrowers.length ? Math.max(...localBorrowers.map(x => x.id)) + 1 : 1 };
  localBorrowers.push(newB);
  saveLocal('borrowers', localBorrowers);
  return newB;
}

// Loans
export async function getLoans() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('loans').select('*').order('id', { ascending: true });
      if (!error) return data.map(mapLoanFromDb);
      console.error('Supabase fetch loans error:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }
  return localLoans;
}

export async function addLoan(l) {
  if (supabase) {
    const { data, error } = await supabase.from('loans').insert([mapLoanToDb(l)]).select();
    if (error) {
      console.error('Supabase add loan error:', error);
      throw new Error(error.message || 'Failed to add loan');
    }
    if (data && data.length > 0) return mapLoanFromDb(data[0]);
  }
  const newL = { ...l, id: localLoans.length ? Math.max(...localLoans.map(x => x.id)) + 1 : 1 };
  localLoans.push(newL);
  saveLocal('loans', localLoans);
  return newL;
}

export async function updateLoanStatus(id, status) {
  if (supabase) {
    const { data, error } = await supabase.from('loans').update({ status }).eq('id', id).select();
    if (error) {
      console.error('Supabase update loan status error:', error);
      throw new Error(error.message || 'Failed to update loan status');
    }
    if (data && data.length > 0) return mapLoanFromDb(data[0]);
  }
  const idx = localLoans.findIndex(x => x.id === id);
  if (idx !== -1) {
    localLoans[idx].status = status;
    saveLocal('loans', localLoans);
    return localLoans[idx];
  }
  return null;
}

// Repayments
export async function getRepayments() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('repayments').select('*').order('id', { ascending: true });
      if (!error) return data.map(mapRepaymentFromDb);
      console.error('Supabase fetch repayments error:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }
  return localRepayments;
}

export async function addRepayment(r) {
  if (supabase) {
    const { data, error } = await supabase.from('repayments').insert([mapRepaymentToDb(r)]).select();
    if (error) {
      console.error('Supabase add repayment error:', error);
      throw new Error(error.message || 'Failed to add repayment');
    }
    if (data && data.length > 0) return mapRepaymentFromDb(data[0]);
  }
  const newR = { ...r, id: localRepayments.length ? Math.max(...localRepayments.map(x => x.id)) + 1 : 1 };
  localRepayments.push(newR);
  saveLocal('repayments', localRepayments);
  return newR;
}

// Messages
export async function getMessages() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('messages').select('*').order('id', { ascending: true });
      if (!error) return data.map(mapMessageFromDb);
      console.error('Supabase fetch messages error:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }
  return localMsgs;
}

export async function addMessage(m) {
  if (supabase) {
    const { data, error } = await supabase.from('messages').insert([mapMessageToDb(m)]).select();
    if (error) {
      console.error('Supabase add message error:', error);
      throw new Error(error.message || 'Failed to add message');
    }
    if (data && data.length > 0) return mapMessageFromDb(data[0]);
  }
  const newM = { ...m, id: localMsgs.length ? Math.max(...localMsgs.map(x => x.id)) + 1 : 1, sentAt: new Date().toISOString() };
  localMsgs.push(newM);
  saveLocal('msgs', localMsgs);
  return newM;
}

// --- UPI Auto Payments ---
export async function getUpiPayments() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('upi_auto_payments').select('*').order('id', { ascending: false });
      if (!error) return data.map(mapUpiPaymentFromDb);
      console.error('Supabase fetch UPI payments error:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }
  return localUpiPayments;
}

export async function addUpiPayment(p) {
  if (supabase) {
    const { data, error } = await supabase.from('upi_auto_payments').insert([mapUpiPaymentToDb(p)]).select();
    if (error) {
      console.error('Supabase add UPI payment error:', error);
      throw new Error(error.message || 'Failed to add UPI payment');
    }
    if (data && data.length > 0) return mapUpiPaymentFromDb(data[0]);
  }
  const newP = { ...p, id: localUpiPayments.length ? Math.max(...localUpiPayments.map(x => x.id)) + 1 : 1, detectedAt: new Date().toISOString() };
  localUpiPayments.push(newP);
  saveLocal('upi_payments', localUpiPayments);
  return newP;
}

export async function updateUpiPaymentStatus(id, status, borrowerId, linkedRepaymentId) {
  if (supabase) {
    const updateObj = { status };
    if (borrowerId !== undefined) updateObj.borrower_id = borrowerId;
    if (linkedRepaymentId !== undefined) updateObj.linked_repayment_id = linkedRepaymentId;
    const { data, error } = await supabase.from('upi_auto_payments').update(updateObj).eq('id', id).select();
    if (error) {
      console.error('Supabase update UPI payment error:', error);
      throw new Error(error.message || 'Failed to update UPI payment status');
    }
    if (data && data.length > 0) return mapUpiPaymentFromDb(data[0]);
  }
  const idx = localUpiPayments.findIndex(x => x.id === id);
  if (idx !== -1) {
    localUpiPayments[idx].status = status;
    if (borrowerId !== undefined) localUpiPayments[idx].borrowerId = borrowerId;
    if (linkedRepaymentId !== undefined) localUpiPayments[idx].linkedRepaymentId = linkedRepaymentId;
    saveLocal('upi_payments', localUpiPayments);
    return localUpiPayments[idx];
  }
  return null;
}

// --- Update borrower (for adding UPI VPA later) ---
export async function updateBorrower(id, fields) {
  if (supabase) {
    const dbFields = {};
    if (fields.name !== undefined) dbFields.name = fields.name;
    if (fields.phone !== undefined) dbFields.phone = fields.phone;
    if (fields.email !== undefined) dbFields.email = fields.email;
    if (fields.address !== undefined) dbFields.address = fields.address;
    if (fields.village !== undefined) dbFields.village = fields.village;
    if (fields.upiVpa !== undefined) dbFields.upi_vpa = fields.upiVpa;
    if (fields.isActive !== undefined) dbFields.is_active = fields.isActive;
    if (fields.photo !== undefined) dbFields.photo = fields.photo;
    if (fields.document !== undefined) dbFields.document = fields.document;
    if (fields.collectionDay !== undefined) dbFields.collection_day = fields.collectionDay;
    const { data, error } = await supabase.from('borrowers').update(dbFields).eq('id', id).select();
    if (error) {
      console.error('Supabase update borrower error:', error);
      throw new Error(error.message || 'Failed to update borrower');
    }
    if (data && data.length > 0) return mapBorrowerFromDb(data[0]);
  }
  const idx = localBorrowers.findIndex(x => x.id === id);
  if (idx !== -1) {
    Object.assign(localBorrowers[idx], fields);
    saveLocal('borrowers', localBorrowers);
    return localBorrowers[idx];
  }
  return null;
}

// --- RAW INCOMING SMS ---
export async function getUnprocessedSms() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('raw_incoming_sms').select('*').eq('processed', false);
      if (!error) return data;
      console.error('Supabase fetch unprocessed sms error:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }
  return localRawSms.filter(x => !x.processed);
}

export async function markSmsProcessed(id) {
  if (supabase) {
    try {
      const { error } = await supabase.from('raw_incoming_sms').update({ processed: true }).eq('id', id);
      if (error) console.error('Supabase mark sms processed error:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }
  const idx = localRawSms.findIndex(x => x.id === id);
  if (idx !== -1) {
    localRawSms[idx].processed = true;
    saveLocal('raw_sms', localRawSms);
  }
}

export async function addRawSms(sms) {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('raw_incoming_sms').insert([{ sms_text: sms.smsText || sms.sms_text, sender: sms.sender || 'Unknown', processed: false }]).select();
      if (!error && data && data.length > 0) return data[0];
      console.error('Supabase add raw sms error:', error);
    } catch (e) {
      console.error('Supabase error:', e);
    }
  }
  const newSms = { id: localRawSms.length ? Math.max(...localRawSms.map(x => x.id)) + 1 : 1, sms_text: sms.smsText || sms.sms_text, sender: sms.sender || 'Unknown', received_at: new Date().toISOString(), processed: false };
  localRawSms.push(newSms);
  saveLocal('raw_sms', localRawSms);
  return newSms;
}

export function subscribeToRealtimeSms(callback) {
  if (supabase) {
    return supabase
      .channel('raw_incoming_sms_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'raw_incoming_sms'
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();
  }
  return null;
}

