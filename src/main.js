import {
  getBorrowers,
  addBorrower,
  updateBorrower,
  getLoans,
  addLoan,
  updateLoanStatus,
  getRepayments,
  addRepayment,
  getMessages,
  addMessage,
  getUpiPayments,
  addUpiPayment,
  updateUpiPaymentStatus,
  isDbConnected,
  getCredentials,
  setCredentials,
  getUnprocessedSms,
  markSmsProcessed,
  addRawSms,
  subscribeToRealtimeSms,
  uploadReceiptFile
} from './db.js';
import { parseBankSMS, matchVPAToBorrower, SAMPLE_SMS } from './sms-parser.js';
import { jsPDF } from 'jspdf';


// --- TRANSLATIONS ---
const T = {
  en: {
    dashboard: 'Home',
    calllist: 'Call List',
    borrowers: 'Borrowers',
    loans: 'Loans',
    repayments: 'Repayments',
    messages: 'Messages',
    settings: 'Settings',
    overview: 'Overview',
    manage: 'Manage',
    comm: 'Communication',
    totalLoans: 'Total Active Loans',
    outstanding: 'Total Outstanding',
    monthIncome: 'This Month Income',
    overdue: 'Overdue Loans',
    addBorrower: 'Add Borrower',
    addLoan: 'Add Loan',
    logRepayment: 'Log Repayment',
    search: 'Search...',
    name: 'Name',
    phone: 'Phone',
    email: 'Email',
    address: 'Address',
    status: 'Status',
    amount: 'Amount (₹)',
    rate: 'Interest Rate (%/month)',
    tenure: 'Tenure (months)',
    startDate: 'Start Date',
    method: 'Method',
    notes: 'Notes',
    save: 'Save',
    cancel: 'Cancel',
    send: 'Send',
    close: 'Close loan',
    language: 'Language',
    lenderName: 'Lender Name',
    monthlyIncome: 'Monthly Interest Collected (₹)',
    loanStatus: 'Loan Status Distribution',
    recentRepayments: 'Recent Repayments',
    overdueLoans: 'Overdue Loans',
    activeBorrowers: 'Active Borrowers',
    repaidThisMonth: 'Repaid This Month',
    collectedVsExpected: 'Collected vs Expected',
    dueDate: 'Due Date',
    principal: 'Principal (₹)',
    emi: 'Monthly EMI',
    paid: 'Amount Paid',
    on: 'Date',
    receipt: 'Receipt #',
    delete: 'Delete',
    viewLoan: 'View Loan',
    message: 'Send Message',
    typeMsg: 'Type a message...',
    settingsTitle: 'Account & Preferences',
    changePass: 'Change Password',
    oldPass: 'Old Password',
    newPass: 'New Password',
    totalInterest: 'Total Interest Earned',
    collections: 'Collections',
    allRepayments: 'All Repayments',
    growth: 'Portfolio Growth',
    topBorrowers: 'Top Borrowers by Outstanding',
    performance: 'Repayment Performance'
  },
  te: {
    dashboard: 'హోమ్',
    calllist: 'కాల్ లిస్ట్',
    borrowers: 'రుణగ్రహీతలు',
    loans: 'రుణాలు',
    repayments: 'చెల్లింపులు',
    messages: 'సందేశాలు',
    settings: 'సెట్టింగ్‌లు',
    overview: 'అవలోకనం',
    manage: 'నిర్వహణ',
    comm: 'సందేశాలు',
    totalLoans: 'మొత్తం చురుకైన రుణాలు',
    outstanding: 'మొత్తం బకాయి',
    monthIncome: 'ఈ నెల ఆదాయం',
    overdue: 'గడువు మించిన రుణాలు',
    addBorrower: 'రుణగ్రహీతను జోడించు',
    addLoan: 'రుణం జోడించు',
    logRepayment: 'చెల్లింపు నమోదు',
    search: 'వెతకండి...',
    name: 'పేరు',
    phone: 'ఫోన్',
    email: 'ఇమెయిల్',
    address: 'చిరునామా',
    status: 'స్థితి',
    amount: 'మొత్తం (₹)',
    rate: 'వడ్డీ రేటు (%/నెల)',
    tenure: 'వ్యవధి (నెలలు)',
    startDate: 'ప్రారంభ తేదీ',
    method: 'పద్ధతి',
    notes: 'గమనికలు',
    save: 'సేవ్ చేయి',
    cancel: 'రద్దు చేయి',
    send: 'పంపు',
    close: 'రుణం మూసివేయి',
    language: 'భాష',
    lenderName: 'రుణదాత పేరు',
    monthlyIncome: 'నెలవారీ వడ్డీ వసూలు (₹)',
    loanStatus: 'రుణ స్థితి పంపిణీ',
    recentRepayments: 'ఇటీవలి చెల్లింపులు',
    overdueLoans: 'గడువు మించిన రుణాలు',
    activeBorrowers: 'చురుకైన రుణగ్రహీతలు',
    repaidThisMonth: 'ఈ నెల చెల్లింపు',
    collectedVsExpected: 'సేకరించిన vs అంచనా',
    dueDate: 'గడువు తేదీ',
    principal: 'అసలు (₹)',
    emi: 'నెలవారీ EMI',
    paid: 'చెల్లించిన మొత్తం',
    on: 'తేదీ',
    receipt: 'రసీదు #',
    delete: 'తొలగించు',
    viewLoan: 'రుణం చూడు',
    message: 'సందేశం పంపు',
    typeMsg: 'సందేశం టైప్ చేయండి...',
    settingsTitle: 'ఖాతా & ప్రాధాన్యతలు',
    changePass: 'పాస్‌వర్డ్ మార్చు',
    oldPass: 'పాత పాస్‌వర్డ్',
    newPass: 'కొత్త పాస్‌వర్డ్',
    totalInterest: 'మొత్తం వడ్డీ సంపాదన',
    collections: 'వసూళ్ళు',
    allRepayments: 'అన్ని చెల్లింపులు',
    growth: 'పోర్ట్‌ఫోలియో వృద్ధి',
    topBorrowers: 'అత్యధిక బకాయి రుణగ్రహీతలు',
    performance: 'చెల్లింపు పనితీరు'
  },
  hi: {
    dashboard: 'होम',
    calllist: 'कॉल लिस्ट',
    borrowers: 'उधारकर्ता',
    loans: 'ऋण',
    repayments: 'भुगतान',
    messages: 'संदेश',
    settings: 'सेटिंग्स',
    overview: 'अवलोकन',
    manage: 'प्रबंधन',
    comm: 'संचार',
    totalLoans: 'कुल सक्रिय ऋण',
    outstanding: 'कुल बकाया',
    monthIncome: 'इस माह की आय',
    overdue: 'अतिदेय ऋण',
    addBorrower: 'उधारकर्ता जोड़ें',
    addLoan: 'ऋण जोड़ें',
    logRepayment: 'भुगतान दर्ज करें',
    search: 'खोजें...',
    name: 'नाम',
    phone: 'फ़ोन',
    email: 'ईमेल',
    address: 'पता',
    status: 'स्थिति',
    amount: 'राशि (₹)',
    rate: 'ब्याज दर (%/माह)',
    tenure: 'अवधि (महीने)',
    startDate: 'प्रारंभ तिथि',
    method: 'तरीका',
    notes: 'नोट्स',
    save: 'सहेजें',
    cancel: 'रद्द करें',
    send: 'भेजें',
    close: 'ऋण बंद करें',
    language: 'भाषा',
    lenderName: 'ऋणदाता नाम',
    monthlyIncome: 'मासिक ब्याज (₹)',
    loanStatus: 'ऋण स्थिति वितरण',
    recentRepayments: 'हाल के भुगतान',
    overdueLoans: 'अतिदेय ऋण',
    activeBorrowers: 'सक्रिय उधारकर्ता',
    repaidThisMonth: 'इस माह भुगतान',
    collectedVsExpected: 'एकत्रित बनाम अनुमानित',
    dueDate: 'देय तिथि',
    principal: 'मूलधन (₹)',
    emi: 'मासिक EMI',
    paid: 'भुगतान राशि',
    on: 'तिथि',
    receipt: 'रसीद #',
    delete: 'हटाएं',
    viewLoan: 'ऋण देखें',
    message: 'संदेश भेजें',
    typeMsg: 'संदेश टाइप करें...',
    settingsTitle: 'खाता और प्राथमिकताएं',
    changePass: 'पासवर्ड बदलें',
    oldPass: 'पुराना पासवर्ड',
    newPass: 'नया पासवर्ड',
    totalInterest: 'कुल ब्याज आय',
    collections: 'वसूली',
    allRepayments: 'सभी भुगतान',
    growth: 'पोर्टफोलियो वृद्धि',
    topBorrowers: 'शीर्ष उधारकर्ता',
    performance: 'भुगतान प्रदर्शन'
  }
};

// --- APP STATE ---
let lang = 'en';
let settings = JSON.parse(localStorage.getItem('lenderbook_settings')) || {
  lenderName: 'Ramaiah Finance',
  currency: '₹',
  fatherPhone: '',
  fatherUpiId: '',
  upiAutoDetect: true,
  appPassword: ''
};
let currentPage = 'dashboard';
let searchQ = '';
let modalOpen = false;

// Data cache (populated from DB)
let borrowers = [];
let loans = [];
let repayments = [];
let msgs = [];
let upiPayments = [];

function updateLenderNameUI() {
  const nameSidebar = document.getElementById('lender-name-sidebar');
  if (nameSidebar) nameSidebar.textContent = settings.lenderName;
  
  const avatar = document.getElementById('lender-avatar');
  if (avatar && settings.lenderName) {
    avatar.textContent = settings.lenderName.charAt(0).toUpperCase();
  }
  
  document.title = 'LenderBook — ' + settings.lenderName;
}

let nextRepaymentId = 100;
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// --- CALCULATION HELPERS ---
function calcEMI(p, r, n) {
  // Backwards compatibility fallback if needed
  const rm = (r || 2.0) / 100;
  return Math.round(p * rm * Math.pow(1 + rm, n) / (Math.pow(1 + rm, n) - 1));
}

function getLoanStats(loan) {
  const emi = loan.repaymentAmount || 0;
  const totalPayable = emi * loan.tenure;
  const totalPaid = repayments.filter(r => r.loanId === loan.id).reduce((s, r) => s + r.amount, 0);
  const totalInterest = Math.max(0, totalPayable - loan.principal);
  const amountLeft = Math.max(0, totalPayable - totalPaid);
  return {
    emi,
    totalPayable,
    totalPaid,
    totalInterest,
    amountLeft
  };
}

function calcOutstanding(loan) {
  return getLoanStats(loan).amountLeft;
}

function fmt(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function borrowerName(id) {
  const b = borrowers.find(x => x.id === id);
  return b ? b.name : 'Unknown';
}

function t(k) {
  return T[lang][k] || T.en[k] || k;
}

// --- SMS PROCESSING HELPERS ---
async function processIncomingSmsRow(row) {
  const result = parseBankSMS(row.sms_text);
  if (result.parsed && result.amount) {
    // Try to match VPA to a borrower
    let matchedBorrowerId = null;
    if (result.senderVPA) {
      const matched = matchVPAToBorrower(result.senderVPA, borrowers.map(b => ({ ...b, vpa: b.upiVpa })));
      if (matched) matchedBorrowerId = matched.id;
    }

    // Add to UPI auto payments
    await addUpiPayment({
      borrowerId: matchedBorrowerId,
      amount: result.amount,
      upiVpa: result.senderVPA || 'unknown',
      bankSmsText: row.sms_text,
      status: 'PENDING'
    });
    
    const bName = matchedBorrowerId ? borrowers.find(b => b.id === matchedBorrowerId)?.name : null;
    if (bName) {
      showToast(`Auto-detected SMS payment: ${fmt(result.amount)} from ${bName} ✓`);
    } else {
      showToast(`Auto-detected SMS payment: ${fmt(result.amount)} (Unknown sender)`);
    }
  }
  // Always mark as processed so we don't scan it again
  await markSmsProcessed(row.id);
}

async function processUnprocessedSms() {
  try {
    const rawList = await getUnprocessedSms();
    if (rawList && rawList.length > 0) {
      for (const sms of rawList) {
        await processIncomingSmsRow(sms);
      }
    }
  } catch (e) {
    console.error('Error processing raw SMS:', e);
  }
}


// --- DB SYNC HELPERS ---
async function refreshData() {
  borrowers = await getBorrowers();
  
  // Auto-detect and parse any unprocessed incoming SMS
  await processUnprocessedSms();

  loans = await getLoans();
  repayments = await getRepayments();
  msgs = await getMessages();
  upiPayments = await getUpiPayments();


  // When Supabase is connected, clear stale localStorage caches
  // so phantom duplicates from old offline sessions never resurface
  if (isDbConnected()) {
    localStorage.removeItem('lb_borrowers');
    localStorage.removeItem('lb_loans');
    localStorage.removeItem('lb_repayments');
    localStorage.removeItem('lb_msgs');
    localStorage.removeItem('lb_upi_payments');
  }

  // Deduplicate local storage loans if needed (offline mode only)
  if (!isDbConnected() && loans.length > 0) {
    const seen = new Set();
    const uniqueLoans = [];
    let changed = false;
    
    for (const l of loans) {
      const key = `${l.borrowerId}-${l.principal}-${l.startDate}-${l.repaymentAmount}`;
      const hasRep = repayments.some(r => r.loanId === l.id);
      
      if (!seen.has(key)) {
        uniqueLoans.push(l);
        seen.add(key);
      } else if (hasRep) {
        const existingIdx = uniqueLoans.findIndex(x => `${x.borrowerId}-${x.principal}-${x.startDate}-${x.repaymentAmount}` === key);
        if (existingIdx !== -1) {
          const existing = uniqueLoans[existingIdx];
          const existingHasRep = repayments.some(r => r.loanId === existing.id);
          if (!existingHasRep) {
            uniqueLoans[existingIdx] = l;
            changed = true;
          }
        }
      } else {
        changed = true;
      }
    }
    
    if (changed) {
      loans = uniqueLoans;
      localStorage.setItem('lb_loans', JSON.stringify(loans));
    }
  }

  // Keep next repayment id incrementing
  if (repayments.length > 0) {
    const ids = repayments.map(r => {
      const match = String(r.receipt).match(/\d+/);
      return match ? parseInt(match[0]) : r.id;
    });
    nextRepaymentId = Math.max(...ids, 100) + 1;
  }
}

// --- APP ROUTING & TRANSLATION ---
function setLang(l) {
  lang = l;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.lang-btn[onclick="window.setLang('${l}')"]`)?.classList.add('active');
  updateLenderNameUI();
  const nlComm = document.getElementById('nl-comm');
  if (nlComm) nlComm.textContent = t('comm');
  document.getElementById('nl-overview').textContent = t('overview');
  document.getElementById('nl-manage').textContent = t('manage');
  ['dashboard', 'calllist', 'borrowers', 'loans', 'repayments', 'messages', 'settings'].forEach(p => {
    const el = document.getElementById('nt-' + p);
    if (el) el.textContent = t(p);
  });
  nav(currentPage);
}

function nav(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const navItem = document.getElementById('nav-' + page);
  if (navItem) navItem.classList.add('active');
  document.getElementById('page-title').textContent = t(page.startsWith('borrower-') || page.startsWith('loan-') || page.startsWith('conversation-') ? 'Overview' : page);
  renderPage(page);
}

function renderPage(page) {
  const el = document.getElementById('page');
  if (page === 'dashboard') el.innerHTML = renderDashboard();
  else if (page === 'borrowers') el.innerHTML = renderBorrowers();
  else if (page === 'loans') el.innerHTML = renderLoans();
  else if (page === 'repayments') el.innerHTML = renderRepayments();
  else if (page === 'messages') el.innerHTML = renderMessages();
  else if (page === 'calllist') el.innerHTML = renderCallList();
  else if (page === 'settings') el.innerHTML = renderSettings();
  else if (page.startsWith('borrower-')) el.innerHTML = renderBorrowerDetail(+page.split('-')[1]);
  else if (page.startsWith('loan-')) el.innerHTML = renderLoanDetail(+page.split('-')[1]);
  bindEvents(page);
}

// --- MESSAGING HELPER ---
function getBorrowerOverdueLoan(borrowerId) {
  const nowStr = new Date().toISOString().split('T')[0];
  const borrowerLoans = loans.filter(l => l.borrowerId === borrowerId && calcOutstanding(l) > 0);
  for (const l of borrowerLoans) {
    if (l.status === 'OVERDUE' || l.status === 'DEFAULTED') {
      return l;
    }
    if (l.dueDate < nowStr) {
      const diffTime = new Date(nowStr) - new Date(l.dueDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 1) return l;
    }
  }
  return null;
}

function generateTeluguOverdueMessage(borrower, loan) {
  const stats = getLoanStats(loan);
  return `నమస్కారం ${borrower.name} గారు,

${settings.lenderName} నుండి సమాచారం. మీ లోన్ బకాయి చెల్లింపు గడువు తేదీ (${loan.dueDate}) ముగిసినది.

బకాయి ఉన్న మొత్తం: ${fmt(stats.amountLeft)}

దయచేసి మీ బకాయిని వెంటనే చెల్లించగలరు.

ధన్యవాదాలు,
${settings.lenderName}`;
}

function sendDirectWhatsApp(borrowerId, encodedMsg) {
  const b = borrowers.find(x => x.id === borrowerId);
  if (!b) return;
  const phone = b.phone ? b.phone.replace(/\D/g, '') : '';
  const url = `https://api.whatsapp.com/send?phone=${phone.startsWith('91') ? phone : '91' + phone}&text=${encodedMsg}`;
  window.open(url, '_blank');
  closeModal();
  showToast('WhatsApp draft opened!');
}

function sendAllWhatsAppReminders() {
  const overdueLoans = loans.filter(l => {
    const out = calcOutstanding(l);
    if (out <= 0) return false;
    const nowStr = new Date().toISOString().split('T')[0];
    return l.status === 'OVERDUE' || l.status === 'DEFAULTED' || l.dueDate < nowStr;
  });

  const uniqueBorrowerIds = [...new Set(overdueLoans.map(l => l.borrowerId))];
  
  if (uniqueBorrowerIds.length === 0) {
    showToast('No pending reminders to send.');
    return;
  }

  showToast(`Opening ${uniqueBorrowerIds.length} WhatsApp chats... Please allow popups if blocked!`);

  uniqueBorrowerIds.forEach((bid, idx) => {
    const b = borrowers.find(x => x.id === bid);
    const l = overdueLoans.find(x => x.borrowerId === bid);
    if (b && l) {
      const msg = generateTeluguOverdueMessage(b, l);
      const phone = b.phone ? b.phone.replace(/\D/g, '') : '';
      const cleanPhone = phone.startsWith('91') ? phone : '91' + phone;
      const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
      
      setTimeout(() => {
        window.open(url, '_blank');
      }, idx * 1200);
    }
  });
}

function sendDirectSMS(borrowerId, encodedMsg) {
  const b = borrowers.find(x => x.id === borrowerId);
  if (!b) return;
  const phone = b.phone ? b.phone.replace(/\D/g, '') : '';
  const cleanPhone = phone.startsWith('91') ? phone : '91' + phone;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const url = `sms:+${cleanPhone}${isIOS ? '&' : '?'}body=${encodedMsg}`;
  window.open(url, '_blank');
  closeModal();
  showToast('SMS app opened!');
}

function sendManualMessage(borrowerId, type) {
  const content = document.getElementById('m-manual-msg').value.trim();
  if (!content) {
    showToast('Please type a manual message first');
    return;
  }
  const encoded = encodeURIComponent(content);
  if (type === 'whatsapp') {
    sendDirectWhatsApp(borrowerId, encoded);
  } else {
    sendDirectSMS(borrowerId, encoded);
  }
}

// --- PAGES RENDERING ---

function renderDashboard() {
  const activeLoans = loans.filter(l => l.status === 'ACTIVE');
  const overdueLoans = loans.filter(l => {
    const out = calcOutstanding(l);
    if (out <= 0) return false;
    const nowStr = new Date().toISOString().split('T')[0];
    return l.status === 'OVERDUE' || l.status === 'DEFAULTED' || l.dueDate < nowStr;
  });
  const totalOutstanding = activeLoans.reduce((s, l) => s + calcOutstanding(l), 0);
  const now = new Date();
  const cm = now.getMonth(), cy = now.getFullYear();
  const monthRep = repayments.filter(r => {
    const d = new Date(r.paidOn);
    return d.getMonth() === cm && d.getFullYear() === cy;
  });
  const monthIncome = monthRep.reduce((s, r) => s + r.amount, 0);
  const recentRep = repayments.slice().sort((a, b) => new Date(b.paidOn) - new Date(a.paidOn)).slice(0, 5);

  const monthData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(cy, cm - i, 1);
    const m = d.getMonth(), y = d.getFullYear();
    const total = repayments.filter(r => {
      const rd = new Date(r.paidOn);
      return rd.getMonth() === m && rd.getFullYear() === y;
    }).reduce((s, r) => s + r.amount, 0);
    monthData.push({ label: months[m], value: total });
  }
  const maxVal = Math.max(...monthData.map(d => d.value), 1);

  const statusCounts = {
    ACTIVE: loans.filter(l => l.status === 'ACTIVE').length,
    OVERDUE: loans.filter(l => l.status === 'OVERDUE').length,
    CLOSED: loans.filter(l => l.status === 'CLOSED').length,
    DEFAULTED: loans.filter(l => l.status === 'DEFAULTED').length
  };
  const totalStatus = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const pieColors = { ACTIVE: '#639922', OVERDUE: '#E24B4A', CLOSED: '#888780', DEFAULTED: '#BA7517' };
  let pie = '';
  Object.entries(statusCounts).forEach(([k, v]) => {
    pie += `<div style="display:flex;align-items:center;gap:8px;margin:3px 0"><div style="width:12px;height:12px;border-radius:50%;background:${pieColors[k]}"></div><span style="font-size:12px;color:var(--color-text-secondary)">${k} <strong>${v}</strong></span></div>`;
  });

  return `
  <div class="stat-grid">
    <div class="stat-card"><div class="stat-label">${t('totalLoans')}</div><div class="stat-value">${activeLoans.length}</div><div class="stat-sub" style="color:#3B6D11">+${loans.filter(l => l.status === 'ACTIVE').length} active</div></div>
    <div class="stat-card"><div class="stat-label">${t('outstanding')}</div><div class="stat-value" style="font-size:18px">${fmt(totalOutstanding)}</div><div class="stat-sub" style="color:var(--color-text-tertiary)">across ${activeLoans.length} loans</div></div>
    <div class="stat-card"><div class="stat-label">${t('monthIncome')}</div><div class="stat-value" style="font-size:18px;color:#185FA5">${fmt(monthIncome)}</div><div class="stat-sub" style="color:var(--color-text-tertiary)">${months[cm]} ${cy}</div></div>
    <div class="stat-card"><div class="stat-label">${t('overdue')}</div><div class="stat-value" style="color:#A32D2D">${overdueLoans.length}</div><div class="stat-sub" style="color:#A32D2D">needs attention</div></div>
  </div>
  <div class="grid2">
    <div class="card">
      <div class="card-title">${t('monthlyIncome')}</div>
      <div class="chart-bar">
        ${monthData.map(d => `<div class="bar-wrap"><div class="bar-val">${d.value ? '₹' + Math.round(d.value / 1000) + 'k' : ''}</div><div class="bar" style="height:${Math.max(4, d.value / maxVal * 100)}px;background:#185FA5"></div><div class="bar-label">${d.label}</div></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="card-title">${t('loanStatus')}</div>
      <div style="padding:4px 0">${pie}</div>
      <div style="margin-top:12px">
        <div class="progress-bar"><div class="progress-fill" style="width:${totalStatus ? statusCounts.ACTIVE / totalStatus * 100 : 0}%;background:#639922"></div></div>
        <div style="font-size:11px;color:var(--color-text-tertiary);margin-top:3px">${totalStatus ? Math.round(statusCounts.ACTIVE / totalStatus * 100) : 0}% loans are active</div>
      </div>
    </div>
  </div>
  <div class="card">
    <div class="card-title">${t('recentRepayments')}</div>
    <table><thead><tr><th>${t('name')}</th><th>${t('paid')}</th><th>${t('on')}</th><th>${t('method')}</th><th>${t('receipt')}</th></tr></thead><tbody>
    ${recentRep.map(r => `<tr><td>${borrowerName(r.borrowerId)}</td><td>${fmt(r.amount)}</td><td>${r.paidOn}</td><td><span class="badge badge-${r.method.toLowerCase()}">${r.method}</span></td><td style="color:var(--color-text-tertiary);font-size:11px">${r.receipt}</td></tr>`).join('')}
    </tbody></table>
  </div>
  ${overdueLoans.length ? `
  <div class="card">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
      <div class="card-title" style="color:#A32D2D; margin-bottom:0;">${t('overdueLoans')}</div>
      <button class="btn btn-sm btn-danger" onclick="window.sendWhatsAppFather()" style="display:inline-flex; align-items:center; gap:6px;">
        <i class="ti ti-brand-whatsapp" aria-hidden="true" style="font-size:14px;"></i> WhatsApp Father
      </button>
    </div>
    <table>
      <thead><tr><th>${t('name')}</th><th>${t('principal')}</th><th>Left to Pay</th><th>${t('dueDate')}</th><th>Action</th></tr></thead>
      <tbody>
        ${overdueLoans.map(l => `
          <tr class="overdue-row">
            <td>${borrowerName(l.borrowerId)}</td>
            <td>${fmt(l.principal)}</td>
            <td style="font-weight:600; color:#A32D2D;">${fmt(calcOutstanding(l))}</td>
            <td>${l.dueDate}</td>
            <td>
              <button class="btn btn-sm btn-primary" onclick="window.showReminderModal(${l.borrowerId})">Reminder</button>
              <button class="btn btn-sm" onclick="window.nav('loan-${l.id}')">${t('viewLoan')}</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>` : ''}

  <div class="grid2">
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <div class="card-title" style="margin-bottom:0; color:#534AB7;">
          <i class="ti ti-credit-card" aria-hidden="true"></i> UPI Auto-Detection
        </div>
      </div>
      <div style="background:var(--color-background-secondary); border-radius:var(--border-radius-md); padding:12px; margin-bottom:12px;">
        <label class="form-label" style="font-weight:600; margin-bottom:6px;">Paste Bank SMS here</label>
        <textarea id="sms-paste-input" rows="3" placeholder="Paste bank credit SMS here...\ne.g. A/c XX1234 credited Rs.2500.00 on 22-Jun by VPA venkatesh@okaxis" style="font-size:12px;"></textarea>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button class="btn btn-sm btn-primary" onclick="window.handleSMSPaste()">
            <i class="ti ti-scan" aria-hidden="true"></i> Detect Payment
          </button>
          <button class="btn btn-sm" onclick="window.loadSampleSMS()">
            <i class="ti ti-test-pipe" aria-hidden="true"></i> Load Sample
          </button>
        </div>
      </div>
      ${renderUpiPendingPayments()}
    </div>

    <div class="card">
      <div class="card-title" style="color:#185FA5;">
        <i class="ti ti-map-pin" aria-hidden="true"></i> Today's Village Collection
      </div>
      ${renderVillageCollection()}
    </div>
  </div>
  `;
}

function renderBorrowers() {
  const filtered = borrowers.filter(b => !searchQ || b.name.toLowerCase().includes(searchQ.toLowerCase()) || b.phone.includes(searchQ));
  return `
  <div class="topbar-section">
    <input class="search-bar" placeholder="${t('search')}" value="${searchQ}" oninput="window.searchQ=this.value; window.renderPage('borrowers')" />
    <button class="btn btn-primary" onclick="window.showAddBorrower()"><i class="ti ti-plus" aria-hidden="true"></i>${t('addBorrower')}</button>
  </div>
  <div class="card" style="padding:0">
    <table><thead><tr><th>#</th><th>${t('name')}</th><th>Village</th><th>${t('phone')}</th><th>UPI VPA</th><th>${t('status')}</th><th>Loans</th><th>Outstanding</th><th></th></tr></thead><tbody>
    ${filtered.map((b, i) => {
      const bLoans = loans.filter(l => l.borrowerId === b.id && l.status === 'ACTIVE');
      const out = bLoans.reduce((s, l) => s + calcOutstanding(l), 0);
      return `<tr><td style="color:var(--color-text-tertiary)">${i + 1}</td><td><div style="display:flex;align-items:center;gap:8px"><div class="avatar" style="width:26px;height:26px;font-size:10px">${b.name.charAt(0)}</div>${b.name}</div></td><td style="color:var(--color-text-secondary);font-size:12px">${b.village || '-'}</td><td>${b.phone}</td><td style="font-size:11px;color:var(--color-text-tertiary)">${b.upiVpa || '-'}</td><td><span class="badge ${b.isActive ? 'badge-active' : 'badge-closed'}">${b.isActive ? 'Active' : 'Inactive'}</span></td><td>${bLoans.length}</td><td>${out ? fmt(out) : '-'}</td><td><button class="btn btn-sm" onclick="window.nav('borrower-${b.id}')">${t('viewLoan')}</button></td></tr>`;
    }).join('')}
    </tbody></table>
  </div>`;
}

function renderBorrowerDetail(id) {
  const b = borrowers.find(x => x.id === id);
  if (!b) return '<div class="empty">Not found</div>';
  const bLoans = loans.filter(l => l.borrowerId === id);
  const bRep = repayments.filter(r => r.borrowerId === id).sort((a, b) => new Date(b.paidOn) - new Date(a.paidOn));
  const totalPaid = bRep.reduce((s, r) => s + r.amount, 0);
  const overdueLoan = getBorrowerOverdueLoan(id);
  
  return `
  <div style="margin-bottom:14px"><button class="btn btn-sm" onclick="window.nav('borrowers')"><i class="ti ti-arrow-left" aria-hidden="true"></i> Back</button></div>
  <div class="grid2">
    <div class="card">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        ${b.photo 
          ? `<img src="${b.photo}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:1px solid var(--color-border-primary);" />` 
          : `<div class="avatar" style="width:48px;height:48px;font-size:18px">${b.name.charAt(0)}</div>`}
        <div><div style="font-size:15px;font-weight:500">${b.name}</div><div style="font-size:12px;color:var(--color-text-tertiary)">${b.phone}</div></div>
      </div>
      <div class="detail-kv"><span class="detail-key">Collection Day</span><span style="font-weight:500;color:#185FA5;">${b.collectionDay || 'Any Day'}</span></div>
      <div class="detail-kv"><span class="detail-key">Signed Doc</span><span>
        ${b.document 
          ? `<button class="btn btn-sm btn-primary" onclick="window.viewSignedDoc(${b.id})" style="padding:2px 8px;font-size:11px;"><i class="ti ti-file-text"></i> View Document</button>` 
          : '<span style="color:var(--color-text-tertiary);">None uploaded</span>'}
      </span></div>
      <div class="detail-kv"><span class="detail-key">${t('email')}</span><span>${b.email || '-'}</span></div>
      <div class="detail-kv"><span class="detail-key">${t('address')}</span><span>${b.address}</span></div>
      <div class="detail-kv"><span class="detail-key">${t('status')}</span><span class="badge ${b.isActive ? 'badge-active' : 'badge-closed'}">${b.isActive ? 'Active' : 'Inactive'}</span></div>
      <div class="detail-kv"><span class="detail-key">Total paid</span><span style="color:#3B6D11;font-weight:500">${fmt(totalPaid)}</span></div>
      <div style="margin-top:12px;display:flex;gap:8px">
        ${overdueLoan ? `<button class="btn btn-sm btn-danger" onclick="window.showReminderModal(${b.id})">Send Reminder</button>` : ''}
        <button class="btn btn-sm" onclick="window.showAddLoan(${b.id})">${t('addLoan')}</button>
        <button class="btn btn-sm" onclick="window.showEditBorrower(${b.id})"><i class="ti ti-edit"></i> Edit Profile</button>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Loans</div>
      ${bLoans.map(l => `<div style="border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);padding:10px 12px;margin-bottom:8px;cursor:pointer" onclick="window.nav('loan-${l.id}')">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-weight:500">${fmt(l.principal)}</span><span class="badge badge-${l.status.toLowerCase()}">${l.status}</span></div>
        <div style="font-size:12px;color:var(--color-text-secondary)">${l.rate}% / month · ${l.tenure} months · Due ${l.dueDate}</div>
        <div style="font-size:12px;color:var(--color-text-tertiary);margin-top:2px">Amount Left to Pay: ${fmt(calcOutstanding(l))}</div>
      </div>`).join('') || '<div class="empty" style="padding:20px">No loans yet</div>'}
    </div>
  </div>
  <div class="card">
    <div class="card-title">Repayment history</div>
    ${bRep.length ? `<table><thead><tr><th>${t('receipt')}</th><th>${t('paid')}</th><th>${t('on')}</th><th>${t('method')}</th><th>Actions</th></tr></thead><tbody>${bRep.map(r => {
      const shareMsg = `Dear ${b.name}, payment of ${fmt(r.amount)} received on ${r.paidOn} via ${r.method}. Receipt #${r.receipt}. Thank you!`;
      const cleanPhone = b.phone.replace(/\D/g, '');
      const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(shareMsg)}`;
      
      return `<tr>
        <td style="font-size:11px;color:var(--color-text-tertiary)">${r.receipt}</td>
        <td style="color:#3B6D11;font-weight:500">${fmt(r.amount)}</td>
        <td>${r.paidOn}</td>
        <td><span class="badge badge-${r.method.toLowerCase()}">${r.method}</span></td>
        <td>
          <div style="display:inline-flex;gap:6px;align-items:center;">
            <button class="btn btn-sm" onclick="window.nav('loan-${r.loanId}')">Loan #${r.loanId}</button>
            ${r.receiptImage ? `<button class="btn btn-sm btn-primary" onclick="window.viewRepaymentReceipt(${r.id})" style="padding:2px 8px;font-size:11px;"><i class="ti ti-photo"></i> View Receipt</button>` : ''}
            <button class="btn btn-sm" onclick="window.shareRepaymentReceipt(${r.id})" style="display:inline-flex;align-items:center;gap:4px;background:#25D366;color:white;border:none;padding:2px 8px;font-size:11px;font-weight:600;border-radius:var(--border-radius-sm);">
              <i class="ti ti-brand-whatsapp"></i> Share
            </button>
          </div>
        </td>
      </tr>`;
    }).join('')}</tbody></table>` : '<div class="empty">No repayments yet</div>'}
  </div>`;
}

function renderLoans() {
  const filter = document.getElementById('loan-filter')?.value || 'ALL';
  const filtered = loans.filter(l => {
    const matchFilter = filter === 'ALL' || l.status === filter;
    const matchSearch = !searchQ || borrowerName(l.borrowerId).toLowerCase().includes(searchQ.toLowerCase());
    return matchFilter && matchSearch;
  });
  return `
  <div class="topbar-section">
    <div style="display:flex;gap:8px;align-items:center">
      <input class="search-bar" placeholder="${t('search')}" value="${searchQ}" oninput="window.searchQ=this.value; window.renderPage('loans')" />
      <select id="loan-filter" onchange="window.renderPage('loans')" style="width:130px;padding:7px 10px"><option value="ALL">All status</option><option value="ACTIVE">Active</option><option value="OVERDUE">Overdue</option><option value="CLOSED">Closed</option><option value="DEFAULTED">Defaulted</option></select>
    </div>
    <button class="btn btn-primary" onclick="window.showAddLoan(null)"><i class="ti ti-plus" aria-hidden="true"></i>${t('addLoan')}</button>
  </div>
  <div class="card" style="padding:0">
    <table><thead><tr><th>${t('name')}</th><th>${t('principal')}</th><th>Cycle</th><th>Repayment</th><th>Amount Left to Pay</th><th>${t('dueDate')}</th><th>${t('status')}</th><th></th></tr></thead><tbody>
    ${filtered.map(l => `<tr class="${l.status === 'OVERDUE' ? 'overdue-row' : ''}"><td>${borrowerName(l.borrowerId)}</td><td>${fmt(l.principal)}</td><td>${l.cycleType === 'WEEKLY' ? 'Weekly' : 'Monthly'}</td><td>${fmt(l.repaymentAmount)}</td><td style="${l.status === 'OVERDUE' ? 'color:#A32D2D' : 'color:#185FA5'};font-weight:500">${fmt(calcOutstanding(l))}</td><td>${l.dueDate}</td><td><span class="badge badge-${l.status.toLowerCase()}">${l.status}</span></td><td><button class="btn btn-sm" onclick="window.nav('loan-${l.id}')">${t('viewLoan')}</button></td></tr>`).join('')}
    </tbody></table>
  </div>`;
}

function renderLoanDetail(id) {
  const l = loans.find(x => x.id === id);
  if (!l) return '<div class="empty">Not found</div>';
  const b = borrowers.find(x => x.id === l.borrowerId);
  const lRep = repayments.filter(r => r.loanId === id).sort((a, b) => new Date(b.paidOn) - new Date(a.paidOn));
  
  const stats = getLoanStats(l);
  const progress = Math.min(100, stats.totalPaid / stats.totalPayable * 100);

  return `
  <div style="margin-bottom:14px"><button class="btn btn-sm" onclick="window.nav('loans')"><i class="ti ti-arrow-left" aria-hidden="true"></i> Back</button></div>
  <div class="grid2">
    <div class="card">
      <div class="card-title">Loan details</div>
      <div class="detail-kv"><span class="detail-key">Borrower</span><span style="font-weight:500;cursor:pointer;color:#185FA5" onclick="window.nav('borrower-${b.id}')">${b.name}</span></div>
      <div class="detail-kv"><span class="detail-key">${t('principal')}</span><span>${fmt(l.principal)}</span></div>
      <div class="detail-kv"><span class="detail-key">Repayment Cycle</span><span>${l.cycleType === 'WEEKLY' ? 'Weekly' : 'Monthly'}</span></div>
      <div class="detail-kv"><span class="detail-key">Tenure</span><span>${l.tenure} ${l.cycleType === 'WEEKLY' ? 'weeks' : 'months'}</span></div>
      <div class="detail-kv"><span class="detail-key">Repayment Amount</span><span style="font-weight:500">${fmt(l.repaymentAmount)}</span></div>
      
      <div class="detail-kv" style="border-top:1px dashed var(--color-border-secondary); margin-top:8px; padding-top:8px;"><span class="detail-key">Total Payable (with Interest)</span><span style="font-weight:600;">${fmt(stats.totalPayable)}</span></div>
      <div class="detail-kv"><span class="detail-key">Total Interest</span><span style="font-weight:500; color:#BA7517;">${fmt(stats.totalInterest)}</span></div>
      <div class="detail-kv"><span class="detail-key">Total Payments Made</span><span style="color:#3B6D11;font-weight:500">${fmt(stats.totalPaid)}</span></div>
      <div class="detail-kv"><span class="detail-key">Total Amount Left to Pay</span><span style="color:#185FA5;font-weight:600">${fmt(stats.amountLeft)}</span></div>
      
      <div class="detail-kv" style="border-top:1px dashed var(--color-border-secondary); margin-top:8px; padding-top:8px;"><span class="detail-key">Start date</span><span>${l.startDate}</span></div>
      <div class="detail-kv"><span class="detail-key">Due date</span><span>${l.dueDate}</span></div>
      <div class="detail-kv"><span class="detail-key">Collateral</span><span>${l.collateral || '-'}</span></div>
      <div class="detail-kv"><span class="detail-key">${t('status')}</span><span class="badge badge-${l.status.toLowerCase()}">${l.status}</span></div>
      <div style="margin-top:14px">
        <div style="font-size:11px;color:var(--color-text-tertiary);margin-bottom:4px">Repayment progress</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
        <div style="font-size:11px;color:var(--color-text-secondary);margin-top:3px">${Math.round(progress)}% repaid</div>
      </div>
      <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm btn-primary" onclick="window.showLogRepayment(${l.id},${l.borrowerId})">${t('logRepayment')}</button>
        ${l.status !== 'CLOSED' ? `<button class="btn btn-sm btn-danger" onclick="window.closeLoan(${l.id})">${t('close')}</button>` : ''}
        ${['OVERDUE', 'DEFAULTED'].includes(l.status) ? `<button class="btn btn-sm" onclick="window.showReminderModal(${l.borrowerId})">Remind</button>` : ''}
      </div>
    </div>
    <div class="card">
      <div class="card-title">Repayment history</div>
      ${lRep.length ? `<div>${lRep.map(r => `<div class="timeline-item"><div><div class="timeline-dot"></div></div><div style="flex:1"><div style="display:flex;justify-content:space-between"><span style="font-weight:500;color:#3B6D11">${fmt(r.amount)}</span><span style="font-size:11px;color:var(--color-text-tertiary)">${r.paidOn}</span></div><div style="font-size:11px;color:var(--color-text-secondary);margin-top:2px"><span class="badge badge-${r.method.toLowerCase()}">${r.method}</span> · ${r.receipt}</div></div></div>`).join('')}</div>` : '<div class="empty">No repayments yet</div>'}
    </div>
  </div>`;
}

function renderRepayments() {
  const sorted = repayments.slice().sort((a, b) => new Date(b.paidOn) - new Date(a.paidOn));
  const filtered = sorted.filter(r => !searchQ || borrowerName(r.borrowerId).toLowerCase().includes(searchQ.toLowerCase()));
  const total = filtered.reduce((s, r) => s + r.amount, 0);

  const grouped = {};
  filtered.forEach(r => {
    if (!grouped[r.borrowerId]) grouped[r.borrowerId] = [];
    grouped[r.borrowerId].push(r);
  });

  let accordionHtml = '';
  Object.entries(grouped).forEach(([bId, reps]) => {
    const borrowerId = parseInt(bId);
    const b = borrowers.find(x => x.id === borrowerId);
    if (!b) return;
    const totalPaid = reps.reduce((s, r) => s + r.amount, 0);
    const bLoans = loans.filter(l => l.borrowerId === borrowerId);

    let loansSummaryHtml = '';
    bLoans.filter(l => l.status !== 'CLOSED').forEach(l => {
      const stats = getLoanStats(l);
      loansSummaryHtml += `
        <div class="rep-calc-card">
          <div style="font-weight:600; font-size:12px; color:var(--color-text-primary); margin-bottom:6px;">
            Loan #${l.id} (Principal: ${fmt(l.principal)})
          </div>
          <div style="font-size:11px; display:grid; gap:4px;">
            <div style="display:flex; justify-content:space-between;"><span style="color:var(--color-text-secondary);">Total Payments Made:</span><span style="font-weight:600; color:#3B6D11;">${fmt(stats.totalPaid)}</span></div>
            <div style="display:flex; justify-content:space-between;"><span style="color:var(--color-text-secondary);">Total Interest (Tenure):</span><span style="font-weight:500;">${fmt(stats.totalInterest)}</span></div>
            <div style="display:flex; justify-content:space-between;"><span style="color:var(--color-text-secondary);">Amount Left to Pay:</span><span style="font-weight:600; color:#185FA5;">${fmt(stats.amountLeft)}</span></div>
          </div>
        </div>
      `;
    });

    if (!loansSummaryHtml) {
      loansSummaryHtml = '<div style="font-size:12px; color:var(--color-text-tertiary); padding:4px 0;">No active loans.</div>';
    }

    accordionHtml += `
      <div class="rep-accordion-item">
        <div class="rep-accordion-header" onclick="window.toggleRepaymentDetails(${borrowerId})">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="rep-accordion-toggle-icon" id="rep-icon-${borrowerId}" style="display:inline-block; font-size:10px;">▶</span>
            <span style="font-weight:500; font-size:14px; color:var(--color-text-primary);">${b.name}</span>
          </div>
          <div style="display:flex; gap:16px; font-size:12px; color:var(--color-text-secondary);">
            <span>Repayments: <strong>${reps.length}</strong></span>
            <span>Total Paid: <strong style="color:#3B6D11;">${fmt(totalPaid)}</strong></span>
          </div>
        </div>
        <div class="rep-accordion-content" id="rep-content-${borrowerId}">
          <div style="margin-bottom:14px;">
            <div style="font-size:11px; font-weight:600; text-transform:uppercase; color:var(--color-text-tertiary); margin-bottom:6px; letter-spacing:0.5px;">Active Loan Summary</div>
            <div class="rep-calc-grid">
              ${loansSummaryHtml}
            </div>
          </div>
          <div style="font-size:11px; font-weight:600; text-transform:uppercase; color:var(--color-text-tertiary); margin-bottom:6px; letter-spacing:0.5px;">Repayment History (Non-deletable)</div>
          <table>
            <thead>
              <tr>
                <th>${t('receipt')}</th>
                <th>${t('paid')}</th>
                <th>${t('on')}</th>
                <th>${t('method')}</th>
                <th>${t('notes')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${reps.map(r => `
                <tr>
                  <td style="font-size:11px; color:var(--color-text-tertiary);">${r.receipt}</td>
                  <td style="color:#3B6D11; font-weight:500;">${fmt(r.amount)}</td>
                  <td>${r.paidOn}</td>
                  <td><span class="badge badge-${r.method.toLowerCase()}">${r.method}</span></td>
                  <td style="color:var(--color-text-tertiary);">${r.notes || '-'}</td>
                  <td>
                    <div style="display:inline-flex; gap:6px; align-items:center;">
                      ${r.receiptImage ? `<button class="btn btn-sm btn-primary" onclick="window.viewRepaymentReceipt(${r.id})" style="padding:2px 8px; font-size:11px;"><i class="ti ti-photo"></i> View Receipt</button>` : ''}
                      <button class="btn btn-sm" onclick="window.shareRepaymentReceipt(${r.id})" style="display:inline-flex; align-items:center; gap:4px; background:#25D366; color:white; border:none; padding:2px 8px; font-size:11px; font-weight:600; border-radius:var(--border-radius-sm);">
                        <i class="ti ti-brand-whatsapp"></i> Share
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  return `
  <div class="topbar-section">
    <input class="search-bar" placeholder="${t('search')}" value="${searchQ}" oninput="window.searchQ=this.value; window.renderPage('repayments')" />
    <button class="btn btn-primary" onclick="window.showLogRepayment(null,null)"><i class="ti ti-plus" aria-hidden="true"></i>${t('logRepayment')}</button>
  </div>
  <div class="stat-grid" style="grid-template-columns:repeat(2,1fr);margin-bottom:16px">
    <div class="stat-card"><div class="stat-label">Total Repayments Collected</div><div class="stat-value" style="font-size:18px">${fmt(total)}</div></div>
    <div class="stat-card"><div class="stat-label">Total Borrowers Paid</div><div class="stat-value">${Object.keys(grouped).length}</div></div>
  </div>
  <div style="margin-top: 14px;">
    ${accordionHtml || '<div class="empty">No repayments found</div>'}
  </div>`;
}

function renderCallList() {
  const overdueLoans = loans.filter(l => {
    const out = calcOutstanding(l);
    if (out <= 0) return false;
    const nowStr = new Date().toISOString().split('T')[0];
    return l.status === 'OVERDUE' || l.status === 'DEFAULTED' || l.dueDate < nowStr;
  });

  if (overdueLoans.length === 0) {
    return `
    <div class="card" style="text-align:center; padding:40px; color:var(--color-text-tertiary);">
      <i class="ti ti-circle-check" style="font-size:48px; color:#3B6D11; display:block; margin-bottom:12px;"></i>
      <div style="font-size:16px; font-weight:500; color:var(--color-text-primary); margin-bottom:4px;">Call List Empty</div>
      All borrowers are up to date! No pending calls for tonight.
    </div>`;
  }

  // Group by borrower to avoid duplicates
  const uniqueBorrowerIds = [...new Set(overdueLoans.map(l => l.borrowerId))];
  
  const callListItems = uniqueBorrowerIds.map(bid => {
    const b = borrowers.find(x => x.id === bid);
    if (!b) return '';
    const bLoans = overdueLoans.filter(l => l.borrowerId === bid);
    const totalOverdueAmt = bLoans.reduce((s, l) => s + calcOutstanding(l), 0);
    const phone = b.phone;
    
    return `
    <div class="card" style="margin-bottom:12px; padding:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <div style="font-size:15px; font-weight:600; display:flex; align-items:center; gap:8px;">
            <div class="avatar" style="width:28px; height:28px; font-size:12px;">${b.name.charAt(0)}</div>
            <span style="cursor:pointer; color:#185FA5;" onclick="window.nav('borrower-${b.id}')">${b.name}</span>
            <span style="font-size:11px; font-weight:normal; color:var(--color-text-tertiary);">${b.village ? ' · ' + b.village : ''}</span>
          </div>
          <div style="font-size:12px; color:var(--color-text-secondary); margin-top:6px;">
            Phone: <strong>${phone}</strong> · Overdue Dues: <strong style="color:#A32D2D">${fmt(totalOverdueAmt)}</strong>
          </div>
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <a class="btn btn-sm btn-primary" href="tel:${phone}" style="text-decoration:none;">
            <i class="ti ti-phone"></i> Call Now
          </a>
          <button class="btn btn-sm btn-danger" onclick="window.showReminderModal(${b.id})">
            <i class="ti ti-brand-whatsapp"></i> Remind
          </button>
          <button class="btn btn-sm" onclick="window.quickCollect(${b.id})">
            <i class="ti ti-cash"></i> Collect Cash
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  return `
  <div style="margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
    <div style="font-size:13px; color:var(--color-text-secondary); max-width:450px;">
      These borrowers have unpaid/overdue cycles. Tap the phone icon to call them directly, or tap "Remind" to send Telugu/manual WhatsApp and SMS notifications.
    </div>
    <button class="btn btn-sm btn-danger" onclick="window.sendAllWhatsAppReminders()" style="display:inline-flex; align-items:center; gap:6px; font-weight:600; padding:8px 12px; background:#25D366; border-color:#25D366; color:white;">
      <i class="ti ti-brand-whatsapp" style="font-size:16px;"></i> Send All WhatsApps (One-Click)
    </button>
  </div>
  <div style="max-width: 640px;">
    ${callListItems}
  </div>`;
}

function handleBadgeClick() {
  window._badgeClickCount = (window._badgeClickCount || 0) + 1;
  if (window._badgeClickCount >= 5) {
    const el = document.getElementById('dev-creds-container');
    if (el) el.style.display = 'block';
    showToast('Developer mode: Database credentials unlocked.');
  }
}
window.handleBadgeClick = handleBadgeClick;

function renderSettings() {
  const dbConnected = isDbConnected();
  const dbCreds = getCredentials();
  return `
  <div class="card" style="max-width:480px">
    <div class="card-title">${t('settingsTitle')}</div>
    <div class="form-row"><label class="form-label">${t('lenderName')}</label><input id="s-lenderName" value="${settings.lenderName}" /></div>
    <div class="form-row"><label class="form-label">Father's WhatsApp Number</label><input id="s-fatherPhone" value="${settings.fatherPhone || ''}" placeholder="e.g. 919876543210" /></div>
    <div class="form-row"><label class="form-label">${t('language')}</label>
      <select id="s-lang"><option value="en" ${lang === 'en' ? 'selected' : ''}>English</option><option value="te" ${lang === 'te' ? 'selected' : ''}>తెలుగు</option><option value="hi" ${lang === 'hi' ? 'selected' : ''}>हिन्दी</option></select>
    </div>
    
    <div style="border-top:0.5px solid var(--color-border-tertiary); padding-top:14px; margin-top:14px;">
      <div class="card-title" style="margin-bottom:6px; color:#534AB7;">
        <i class="ti ti-credit-card"></i> UPI Auto-Detection Settings
      </div>
      <div style="background:#EEEDFE; border-radius:var(--border-radius-md); padding:10px 12px; font-size:12px; color:#534AB7; margin-bottom:12px; line-height:1.5;">
        <strong>How it works:</strong> Your father opens a dedicated bank account for lending. All borrowers pay to that UPI ID. When the bank sends an SMS for each credit, paste it in the Dashboard to auto-detect who paid and how much.
      </div>
      <div class="form-row"><label class="form-label">Father's Dedicated UPI ID</label><input id="s-fatherUpiId" value="${settings.fatherUpiId || ''}" placeholder="e.g. ramaiah@sbi" /></div>
      <div class="form-row">
        <label class="form-label">Auto-Detection</label>
        <select id="s-upiAutoDetect">
          <option value="true" ${settings.upiAutoDetect ? 'selected' : ''}>Enabled — Parse bank SMS automatically</option>
          <option value="false" ${!settings.upiAutoDetect ? 'selected' : ''}>Disabled</option>
        </select>
      </div>
      <div style="background:var(--color-background-secondary); border-radius:var(--border-radius-md); padding:10px 12px; font-size:11px; color:var(--color-text-tertiary); line-height:1.5;">
        <i class="ti ti-info-circle"></i> <strong>For full Android automation:</strong> An Android companion app is needed to auto-read bank SMS. Currently, you can paste SMS manually on the Dashboard. Add each borrower's UPI VPA in their profile for auto-matching.
      </div>
    </div>


    <div style="border-top:0.5px solid var(--color-border-tertiary); padding-top:14px; margin-top:14px;">
      <div class="card-title" style="margin-bottom:6px;">Database Connection (Supabase)</div>
      <div style="margin-bottom: 12px; font-size: 12px; cursor: pointer;" onclick="window.handleBadgeClick()">
        ${dbConnected 
          ? '<span class="badge badge-active" style="display:inline-flex; align-items:center; gap:4px;"><i class="ti ti-database-check"></i> Connected & Syncing with Supabase</span>' 
          : '<span class="badge badge-defaulted" style="display:inline-flex; align-items:center; gap:4px;"><i class="ti ti-database-x"></i> Offline Mode: Using LocalStorage</span>'}
      </div>
      <div id="dev-creds-container" style="display:none;">
        <div class="form-row"><label class="form-label">Supabase Project URL</label><input id="s-dbUrl" value="${dbCreds.url}" placeholder="https://xxxx.supabase.co" /></div>
        <div class="form-row"><label class="form-label">Supabase Anon Key</label><input id="s-dbKey" type="password" value="${dbCreds.key}" placeholder="Supabase Anon Key" /></div>
      </div>
    </div>

    <div style="border-top:0.5px solid var(--color-border-tertiary);padding-top:14px;margin-top:14px">
      <div class="card-title" style="margin-bottom:12px">App Access Password Lock</div>
      <div style="font-size:12px; color:var(--color-text-secondary); margin-bottom:10px;">
        Set a password to lock the web app. If set, any visitor must enter this password to view details. Keep empty to disable password lock.
      </div>
      <div class="form-row"><label class="form-label">New Password</label><input type="password" id="s-app-password" value="${settings.appPassword || ''}" placeholder="Set password" /></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px;margin-bottom:14px">
      <button class="btn btn-primary" onclick="window.saveSettings()">${t('save')}</button>
    </div>
  </div>`;
}

function bindEvents(page) {}

// --- POPUPS & MODALS ---

function resizeAndCompressImage(file, maxDimension = 600) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }
    
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      let width = img.width;
      let height = img.height;
      
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => resolve('');
  });
}

function showAddBorrower() {
  document.getElementById('modal-container').innerHTML = `
  <div class="modal-overlay">
    <div class="modal" style="width: 540px; max-width: 95%;">
      <div class="modal-title">${t('addBorrower')}<button class="btn btn-sm" onclick="window.closeModal()">✕</button></div>
      <div class="form-grid">
        <div class="form-row"><label class="form-label">${t('name')} *</label><input id="m-name" placeholder="Full name" /></div>
        <div class="form-row"><label class="form-label">${t('phone')} *</label><input id="m-phone" placeholder="9876543210" /></div>
      </div>
      <div class="form-grid">
        <div class="form-row"><label class="form-label">Village / Area *</label><input id="m-village" placeholder="e.g. Peddapalli" /></div>
        <div class="form-row"><label class="form-label">${t('address')}</label><input id="m-address" placeholder="Full address" /></div>
      </div>
      <div class="form-grid">
        <div class="form-row"><label class="form-label">UPI VPA(s)</label><input id="m-upivpa" placeholder="venkatesh@okaxis, venk@sbi" /></div>
        <div class="form-row"><label class="form-label">${t('email')}</label><input id="m-email" type="email" placeholder="optional" /></div>
      </div>
      <div class="form-grid">
        <div class="form-row">
          <label class="form-label">Collection Day *</label>
          <select id="m-collectionDay">
            <option value="Any Day">Any Day / Daily</option>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>
        </div>
        <div class="form-row"></div>
      </div>
      <div class="form-grid">
        <div class="form-row"><label class="form-label">Borrower Photo</label><input type="file" id="m-photo" accept="image/*" /></div>
        <div class="form-row"><label class="form-label">Signed Agreement / Doc</label><input type="file" id="m-doc" accept="image/*,application/pdf" /></div>
      </div>
      <div style="background:var(--color-background-secondary);border-radius:var(--border-radius-md);padding:8px 10px;font-size:11px;color:var(--color-text-tertiary);margin-bottom:10px">
        <i class="ti ti-info-circle"></i> UPI VPA helps auto-detect payments. Separate multiple VPAs with commas.
      </div>
      <div style="display:flex;gap:8px;margin-top:4px"><button class="btn btn-primary" onclick="window.saveBorrower()">${t('save')}</button><button class="btn" onclick="window.closeModal()">${t('cancel')}</button></div>
    </div>
  </div>`;
}

async function saveBorrower() {
  const saveBtn = document.querySelector('#modal-container button.btn-primary');
  if (saveBtn) {
    if (saveBtn.disabled) return;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="ti ti-loader rotate"></i> Saving...';
  }

  try {
    const name = document.getElementById('m-name').value.trim();
    const phone = document.getElementById('m-phone').value.trim();
    if (!name || !phone) { 
      showToast('Name and phone are required'); 
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = t('save');
      }
      return; 
    }

    const photoFile = document.getElementById('m-photo')?.files[0];
    const docFile = document.getElementById('m-doc')?.files[0];

    let photoBase64 = '';
    let docBase64 = '';

    if (photoFile) photoBase64 = await resizeAndCompressImage(photoFile);
    if (docFile) docBase64 = await resizeAndCompressImage(docFile);
    
    await addBorrower({
      name,
      phone,
      email: document.getElementById('m-email').value,
      address: document.getElementById('m-address').value,
      village: document.getElementById('m-village')?.value?.trim() || '',
      upiVpa: document.getElementById('m-upivpa')?.value?.trim() || '',
      collectionDay: document.getElementById('m-collectionDay')?.value || 'Any Day',
      photo: photoBase64,
      document: docBase64,
      isActive: true
    });
    
    await refreshData();
    closeModal();
    showToast('Borrower added successfully');
    renderPage('borrowers');
  } catch (e) {
    console.error(e);
    showToast('Failed to save borrower: ' + (e.message || e));
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = t('save');
    }
  }
}

function showEditBorrower(id) {
  const b = borrowers.find(x => x.id === id);
  if (!b) return;
  document.getElementById('modal-container').innerHTML = `
  <div class="modal-overlay">
    <div class="modal" style="width: 540px; max-width: 95%;">
      <div class="modal-title">Edit Borrower: ${b.name}<button class="btn btn-sm" onclick="window.closeModal()">✕</button></div>
      <div class="form-grid">
        <div class="form-row"><label class="form-label">${t('name')} *</label><input id="m-name" value="${b.name}" placeholder="Full name" /></div>
        <div class="form-row"><label class="form-label">${t('phone')} *</label><input id="m-phone" value="${b.phone}" placeholder="9876543210" /></div>
      </div>
      <div class="form-grid">
        <div class="form-row"><label class="form-label">Village / Area *</label><input id="m-village" value="${b.village || ''}" placeholder="e.g. Peddapalli" /></div>
        <div class="form-row"><label class="form-label">${t('address')}</label><input id="m-address" value="${b.address || ''}" placeholder="Full address" /></div>
      </div>
      <div class="form-grid">
        <div class="form-row"><label class="form-label">UPI VPA(s)</label><input id="m-upivpa" value="${b.upiVpa || ''}" placeholder="venkatesh@okaxis, venk@sbi" /></div>
        <div class="form-row"><label class="form-label">${t('email')}</label><input id="m-email" type="email" value="${b.email || ''}" placeholder="optional" /></div>
      </div>
      <div class="form-grid">
        <div class="form-row">
          <label class="form-label">Collection Day *</label>
          <select id="m-collectionDay">
            <option value="Any Day" ${b.collectionDay === 'Any Day' ? 'selected' : ''}>Any Day / Daily</option>
            <option value="Monday" ${b.collectionDay === 'Monday' ? 'selected' : ''}>Monday</option>
            <option value="Tuesday" ${b.collectionDay === 'Tuesday' ? 'selected' : ''}>Tuesday</option>
            <option value="Wednesday" ${b.collectionDay === 'Wednesday' ? 'selected' : ''}>Wednesday</option>
            <option value="Thursday" ${b.collectionDay === 'Thursday' ? 'selected' : ''}>Thursday</option>
            <option value="Friday" ${b.collectionDay === 'Friday' ? 'selected' : ''}>Friday</option>
            <option value="Saturday" ${b.collectionDay === 'Saturday' ? 'selected' : ''}>Saturday</option>
            <option value="Sunday" ${b.collectionDay === 'Sunday' ? 'selected' : ''}>Sunday</option>
          </select>
        </div>
        <div class="form-row"></div>
      </div>
      <div class="form-grid">
        <div class="form-row"><label class="form-label">Borrower Photo</label><input type="file" id="m-photo" accept="image/*" /></div>
        <div class="form-row"><label class="form-label">Signed Agreement / Doc</label><input type="file" id="m-doc" accept="image/*,application/pdf" /></div>
      </div>
      <div class="form-row">
        <label class="form-label" style="display:flex; align-items:center; gap:6px;">
          <input type="checkbox" id="m-active" ${b.isActive ? 'checked' : ''} style="width:auto;"> Active Borrower
        </label>
      </div>
      <div style="display:flex;gap:8px;margin-top:4px"><button class="btn btn-primary" onclick="window.saveEditedBorrower(${id})">${t('save')}</button><button class="btn" onclick="window.closeModal()">${t('cancel')}</button></div>
    </div>
  </div>`;
}

async function saveEditedBorrower(id) {
  const saveBtn = document.querySelector('#modal-container button.btn-primary');
  if (saveBtn) {
    if (saveBtn.disabled) return;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="ti ti-loader rotate"></i> Saving...';
  }

  try {
    const name = document.getElementById('m-name').value.trim();
    const phone = document.getElementById('m-phone').value.trim();
    if (!name || !phone) { 
      showToast('Name and phone are required'); 
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = t('save');
      }
      return; 
    }

    const photoFile = document.getElementById('m-photo')?.files[0];
    const docFile = document.getElementById('m-doc')?.files[0];

    const fieldsToUpdate = {
      name,
      phone,
      email: document.getElementById('m-email').value,
      address: document.getElementById('m-address').value,
      village: document.getElementById('m-village')?.value?.trim() || '',
      upiVpa: document.getElementById('m-upivpa')?.value?.trim() || '',
      collectionDay: document.getElementById('m-collectionDay')?.value || 'Any Day',
      isActive: document.getElementById('m-active').checked
    };

    if (photoFile) {
      fieldsToUpdate.photo = await resizeAndCompressImage(photoFile);
    }
    if (docFile) {
      fieldsToUpdate.document = await resizeAndCompressImage(docFile);
    }
    
    await updateBorrower(id, fieldsToUpdate);
    
    await refreshData();
    closeModal();
    showToast('Borrower updated successfully');
    renderPage(`borrower-${id}`);
  } catch (e) {
    console.error(e);
    showToast('Failed to save borrower');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = t('save');
    }
  }
}

function showAddLoan(borrowerId) {
  const options = borrowers.map(b => `<option value="${b.id}" ${b.id === borrowerId ? 'selected' : ''}>${b.name}</option>`).join('');
  document.getElementById('modal-container').innerHTML = `
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-title">${t('addLoan')}<button class="btn btn-sm" onclick="window.closeModal()">✕</button></div>
      <div class="form-row"><label class="form-label">Borrower *</label><select id="m-bid">${options}</select></div>
      <div class="form-grid">
        <div class="form-row"><label class="form-label">${t('amount')} *</label><input id="m-principal" type="number" placeholder="10000" /></div>
        <div class="form-row">
          <label class="form-label">Payment Cycle *</label>
          <select id="m-cycle">
            <option value="MONTHLY">Monthly</option>
            <option value="WEEKLY">Weekly</option>
          </select>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-row"><label class="form-label">Repayment Amount (EMI/EWI) *</label><input id="m-repayment-amount" type="number" placeholder="2083" /></div>
        <div class="form-row"><label class="form-label">Tenure (Number of Cycles) *</label><input id="m-tenure" type="number" placeholder="6" /></div>
      </div>
      <div class="form-grid">
        <div class="form-row"><label class="form-label">${t('startDate')} *</label><input id="m-start" type="date" value="${new Date().toISOString().split('T')[0]}" /></div>
        <div class="form-row"><label class="form-label">Collateral</label><input id="m-collateral" placeholder="Gold / Land docs / etc." /></div>
      </div>
      <div id="emi-preview" style="background:var(--color-background-secondary);border-radius:var(--border-radius-md);padding:10px 12px;font-size:13px;margin-bottom:12px;color:var(--color-text-secondary)">Enter values to see details</div>
      <div style="display:flex;gap:8px"><button class="btn btn-primary" onclick="window.saveLoan()">${t('save')}</button><button class="btn" onclick="window.closeModal()">${t('cancel')}</button></div>
    </div>
  </div>`;
  ['m-principal', 'm-repayment-amount', 'm-tenure', 'm-cycle'].forEach(id => { document.getElementById(id).addEventListener('input', updateEMIPreview) });
}

function updateEMIPreview() {
  const p = +document.getElementById('m-principal').value;
  const r = +document.getElementById('m-repayment-amount').value;
  const n = +document.getElementById('m-tenure').value;
  const cycle = document.getElementById('m-cycle').value;
  const el = document.getElementById('emi-preview');
  if (p && r && n) {
    const roundedN = Math.round(n);
    const totalPayable = r * roundedN;
    const totalInterest = Math.max(0, totalPayable - p);
    el.innerHTML = `Repayment: <strong>${fmt(r)}</strong> ${cycle === 'WEEKLY' ? 'weekly' : 'monthly'} · Total payable: <strong>${fmt(totalPayable)}</strong> · Total interest: <strong>${fmt(totalInterest)}</strong>${n !== roundedN ? ` (Rounded to ${roundedN} cycles)` : ''}`;
  }
  else {
    el.textContent = 'Enter values to see details';
  }
}

async function saveLoan() {
  const saveBtn = document.querySelector('#modal-container button.btn-primary');
  if (saveBtn) {
    if (saveBtn.disabled) return;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="ti ti-loader rotate"></i> Saving...';
  }

  try {
    const p = +document.getElementById('m-principal').value;
    const r = +document.getElementById('m-repayment-amount').value;
    const n = Math.round(+document.getElementById('m-tenure').value);
    const bid = +document.getElementById('m-bid').value;
    const cycle = document.getElementById('m-cycle').value;
    const start = document.getElementById('m-start').value;
    
    if (!p || !r || !n || !bid || !start) { 
      showToast('Please fill all required fields'); 
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = t('save');
      }
      return; 
    }
    
    const due = new Date(start);
    if (cycle === 'WEEKLY') {
      due.setDate(due.getDate() + n * 7);
    } else {
      due.setMonth(due.getMonth() + n);
    }
    
    await addLoan({
      borrowerId: bid,
      principal: p,
      rate: 0,
      tenure: n,
      startDate: start,
      dueDate: due.toISOString().split('T')[0],
      status: 'ACTIVE',
      collateral: document.getElementById('m-collateral').value,
      notes: '',
      cycleType: cycle,
      repaymentAmount: r
    });
    
    await refreshData();
    closeModal();
    showToast('Loan added successfully');
    renderPage('loans');
  } catch (e) {
    console.error(e);
    showToast('Failed to save loan: ' + (e.message || e));
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = t('save');
    }
  }
}

function showLogRepayment(loanId, borrowerId) {
  const activeLoans = loans.filter(l => l.status !== 'CLOSED');
  const loanOptions = activeLoans.map(l => `<option value="${l.id}" ${l.id === loanId ? 'selected' : ''}>#${l.id} — ${borrowerName(l.borrowerId)} (${fmt(l.principal)})</option>`).join('');
  
  const selectedLoan = loanId ? activeLoans.find(l => l.id === loanId) : activeLoans[0];
  const prefillAmt = selectedLoan ? selectedLoan.repaymentAmount : '';

  document.getElementById('modal-container').innerHTML = `
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-title">${t('logRepayment')}<button class="btn btn-sm" onclick="window.closeModal()">✕</button></div>
      <div class="form-row"><label class="form-label">Loan *</label><select id="m-loanid" onchange="window.updateRepaymentPrefill()">${loanOptions}</select></div>
      <div class="form-grid">
        <div class="form-row"><label class="form-label">${t('amount')} *</label><input id="m-repamt" type="number" value="${prefillAmt}" placeholder="2500" /></div>
        <div class="form-row"><label class="form-label">${t('on')} *</label><input id="m-repon" type="date" value="${new Date().toISOString().split('T')[0]}" /></div>
      </div>
      <div class="form-row"><label class="form-label">${t('method')}</label><select id="m-method"><option value="CASH">Cash</option><option value="UPI">UPI</option><option value="BANK">Bank Transfer</option></select></div>
      <div class="form-row"><label class="form-label">${t('notes')}</label><input id="m-repnotes" placeholder="Optional" /></div>
      <div style="display:flex;gap:8px"><button class="btn btn-primary" onclick="window.saveRepayment()">${t('save')}</button><button class="btn" onclick="window.closeModal()">${t('cancel')}</button></div>
    </div>
  </div>`;
}

function updateRepaymentPrefill() {
  const loanId = +document.getElementById('m-loanid').value;
  const loan = loans.find(l => l.id === loanId);
  if (loan) {
    document.getElementById('m-repamt').value = loan.repaymentAmount;
  }
}

async function saveRepayment() {
  const saveBtn = document.querySelector('#modal-container button.btn-primary');
  if (saveBtn) {
    if (saveBtn.disabled) return;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="ti ti-loader rotate"></i> Saving...';
  }

  try {
    const loanId = +document.getElementById('m-loanid').value;
    const amt = +document.getElementById('m-repamt').value;
    const on = document.getElementById('m-repon').value;
    const method = document.getElementById('m-method').value;
    const notesVal = document.getElementById('m-repnotes').value;

    if (!loanId || !amt || !on) { 
      showToast('Please fill required fields'); 
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = t('save');
      }
      return; 
    }
    const loan = loans.find(l => l.id === loanId);
    if (!loan) {
      showToast('Loan not found');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = t('save');
      }
      return;
    }

    const borrower = borrowers.find(b => b.id === loan.borrowerId);
    const borrowerNameStr = borrower ? borrower.name : 'Borrower';
    const borrowerPhoneStr = borrower ? borrower.phone : '';

    // Calculate outstanding balance after this repayment
    const statsBefore = getLoanStats(loan);
    const balanceAfter = Math.max(0, statsBefore.amountLeft - amt);

    const receipt = 'REC-' + String(nextRepaymentId++).padStart(3, '0');
    
    // Auto-generate receipt image (canvas PNG) for inline viewing
    const receiptImgBase64 = generateReceiptImage(
      borrowerNameStr,
      borrowerPhoneStr,
      amt,
      on,
      method,
      receipt,
      notesVal,
      balanceAfter
    );

    const nextRep = await addRepayment({
      loanId,
      borrowerId: loan.borrowerId,
      amount: amt,
      paidOn: on,
      method,
      notes: notesVal,
      receipt,
      receiptImage: receiptImgBase64
    });
    
    await refreshData();
    closeModal();
    showToast('Repayment logged · ' + receipt);
    renderPage(currentPage);

    // Share receipt automatically
    if (nextRep && nextRep.id) {
      setTimeout(() => {
        shareRepaymentReceipt(nextRep.id);
      }, 500);
    }
  } catch (e) {
    console.error(e);
    showToast('Failed to save repayment');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = t('save');
    }
  }
}


function updateReminderPreview(borrowerId) {
  const b = borrowers.find(x => x.id === borrowerId);
  if (!b) return;
  const type = document.getElementById('r-type').value;
  const previewText = document.getElementById('r-preview-text');
  const fineRow = document.getElementById('r-fine-row');
  const manualRow = document.getElementById('r-manual-row');
  const sendBtn = document.getElementById('r-send-btn');
  const sendSmsBtn = document.getElementById('r-send-sms-btn');
  
  if (type === 'OVERDUE') {
    fineRow.style.display = 'block';
    manualRow.style.display = 'none';
    
    const fine = +document.getElementById('r-fine').value || 0;
    const l = getBorrowerOverdueLoan(borrowerId) || loans.find(x => x.borrowerId === borrowerId && ['ACTIVE', 'OVERDUE'].includes(x.status));
    
    const baseMsg = l ? generateTeluguOverdueMessage(b, l) : '';
    let msg = baseMsg;
    if (fine > 0) {
      const stats = l ? getLoanStats(l) : { amountLeft: 0 };
      const total = stats.amountLeft + fine;
      msg = `నమస్కారం ${b.name} గారు,\n\n${settings.lenderName} నుండి సమాచారం. మీ లోన్ బకాయి చెల్లింపు గడువు తేదీ ${l ? `(${l.dueDate})` : ''} ముగిసినది.\n\nబకాయి ఉన్న మొత్తం: ${fmt(stats.amountLeft)}\nజరిమానా (Fine): ${fmt(fine)}\nమొత్తం బకాయి (Total Due): ${fmt(total)}\n\nదయచేసి మీ బకాయిని వెంటనే చెల్లించగలరు.\n\nధన్యవాదాలు,\n${settings.lenderName}`;
    }
    
    previewText.textContent = msg;
    
    sendBtn.onclick = () => window.sendDirectWhatsApp(borrowerId, encodeURIComponent(msg));
    sendSmsBtn.onclick = () => window.sendDirectSMS(borrowerId, encodeURIComponent(msg));
  } else if (type === 'TOMORROW') {
    fineRow.style.display = 'none';
    manualRow.style.display = 'none';
    
    const l = loans.find(x => x.borrowerId === borrowerId && ['ACTIVE', 'OVERDUE'].includes(x.status));
    const repaymentAmt = l ? l.repaymentAmount : 0;
    const tomorrowStr = new Date(Date.now() + 86400000).toLocaleDateString('en-CA');
    
    const msg = `నమస్తే ${b.name},\nరేపు (${tomorrowStr}) మీ వాయిదా చెల్లింపు రూ. ${fmt(repaymentAmt)} చెల్లించాల్సి ఉంది. దయచేసి UPI లేదా నగదు రూపంలో చెల్లించండి. ధన్యవాదాలు.`;
    
    previewText.textContent = msg;
    
    sendBtn.onclick = () => window.sendDirectWhatsApp(borrowerId, encodeURIComponent(msg));
    sendSmsBtn.onclick = () => window.sendDirectSMS(borrowerId, encodeURIComponent(msg));
  } else {
    fineRow.style.display = 'none';
    manualRow.style.display = 'block';
    previewText.textContent = 'Type your custom message below...';
    
    sendBtn.onclick = () => {
      const customVal = document.getElementById('r-manual-msg').value.trim();
      if (!customVal) return showToast('Please type a message');
      window.sendDirectWhatsApp(borrowerId, encodeURIComponent(customVal));
    };
    sendSmsBtn.onclick = () => {
      const customVal = document.getElementById('r-manual-msg').value.trim();
      if (!customVal) return showToast('Please type a message');
      window.sendDirectSMS(borrowerId, encodeURIComponent(customVal));
    };
  }
}
window.updateReminderPreview = updateReminderPreview;

function showSendMessage(borrowerId) {
  const b = borrowers.find(x => x.id === borrowerId);
  if (!b) return;
  const overdueLoan = getBorrowerOverdueLoan(borrowerId) || loans.find(x => x.borrowerId === borrowerId && ['ACTIVE', 'OVERDUE'].includes(x.status));
  
  const initialType = overdueLoan ? 'OVERDUE' : 'TOMORROW';
  const initialMsg = overdueLoan 
    ? generateTeluguOverdueMessage(b, overdueLoan) 
    : (() => {
        const l = loans.find(x => x.borrowerId === borrowerId && ['ACTIVE', 'OVERDUE'].includes(x.status));
        const repaymentAmt = l ? l.repaymentAmount : 0;
        const tomorrowStr = new Date(Date.now() + 86400000).toLocaleDateString('en-CA');
        return `నమస్తే ${b.name},\nరేపు (${tomorrowStr}) మీ వాయిదా చెల్లింపు రూ. ${fmt(repaymentAmt)} చెల్లించాల్సి ఉంది. దయచేసి UPI లేదా నగదు రూపంలో చెల్లించండి. ధన్యవాదాలు.`;
      })();

  document.getElementById('modal-container').innerHTML = `
  <div class="modal-overlay">
    <div class="modal" style="width: 520px; max-width: 95%;">
      <div class="modal-title">Send Reminder to ${b.name}<button class="btn btn-sm" onclick="window.closeModal()">✕</button></div>
      
      <div class="form-row">
        <label class="form-label" style="font-weight: 600;">Reminder Type</label>
        <select id="r-type" onchange="window.updateReminderPreview(${borrowerId})">
          <option value="OVERDUE" ${initialType === 'OVERDUE' ? 'selected' : ''}>Overdue Reminder (Telugu)</option>
          <option value="TOMORROW" ${initialType === 'TOMORROW' ? 'selected' : ''}>Tomorrow's Due Reminder (Telugu)</option>
          <option value="CUSTOM">Custom Message (Manual)</option>
        </select>
      </div>

      <div class="form-row" id="r-fine-row" style="display: ${initialType === 'OVERDUE' ? 'block' : 'none'};">
        <label class="form-label">Fine Amount (₹) - Optional</label>
        <input type="number" id="r-fine" placeholder="Enter fine amount if any" oninput="window.updateReminderPreview(${borrowerId})" />
      </div>

      <div class="form-row" id="r-manual-row" style="display: none;">
        <label class="form-label">Manual Custom Message</label>
        <textarea id="r-manual-msg" rows="4" placeholder="Type custom message here..."></textarea>
      </div>

      <div style="background: var(--color-background-secondary); border: 0.5px solid var(--color-border-primary); border-radius: var(--border-radius-md); padding: 12px; margin-bottom: 14px;">
        <div style="font-weight: 600; color: #185FA5; font-size: 11px; margin-bottom: 6px; display: flex; align-items: center; gap: 4px;">
          <i class="ti ti-brand-whatsapp"></i> MESSAGE PREVIEW
        </div>
        <div id="r-preview-text" style="font-size: 13px; color: var(--color-text-primary); white-space: pre-line; line-height: 1.4; border-left: 3px solid #185FA5; padding-left: 8px;">
          ${initialMsg}
        </div>
      </div>
      
      <div style="display:flex; gap:8px;">
        <button class="btn btn-primary" id="r-send-btn">
          <i class="ti ti-brand-whatsapp"></i> Send via WhatsApp
        </button>
        <button class="btn" id="r-send-sms-btn">
          <i class="ti ti-message"></i> Send via SMS
        </button>
        <button class="btn" onclick="window.closeModal()">${t('cancel')}</button>
      </div>
    </div>
  </div>`;

  // Initialize event handlers
  updateReminderPreview(borrowerId);
}

function viewSignedDoc(borrowerId) {
  const b = borrowers.find(x => x.id === borrowerId);
  if (!b || !b.document) return;
  
  document.getElementById('modal-container').innerHTML = `
  <div class="modal-overlay" onclick="window.closeModal()">
    <div class="modal" onclick="event.stopPropagation()" style="max-width:80%; max-height:85vh; display:flex; flex-direction:column;">
      <div class="modal-title">Signed Document — ${b.name}<button class="btn btn-sm" onclick="window.closeModal()">✕</button></div>
      <div style="flex:1; overflow:auto; text-align:center; padding:10px;">
        ${b.document.startsWith('data:image/') 
          ? `<img src="${b.document}" style="max-width:100%; max-height:70vh; border-radius:var(--border-radius-md);" />` 
          : b.document.startsWith('data:application/pdf')
            ? `<iframe src="${b.document}" style="width:100%; height:70vh; border:none;"></iframe>`
            : `<a href="${b.document}" download="document" class="btn btn-primary">Download Document</a>`}
      </div>
    </div>
  </div>`;
}
window.viewSignedDoc = viewSignedDoc;

function viewRepaymentReceipt(repaymentId) {
  const r = repayments.find(x => x.id === repaymentId);
  if (!r || !r.receiptImage) return;
  const b = borrowers.find(x => x.id === r.borrowerId);
  
  document.getElementById('modal-container').innerHTML = `
  <div class="modal-overlay" onclick="window.closeModal()">
    <div class="modal" onclick="event.stopPropagation()" style="max-width:80%; max-height:85vh; display:flex; flex-direction:column;">
      <div class="modal-title">Repayment Receipt — ${b ? b.name : 'Borrower'}<button class="btn btn-sm" onclick="window.closeModal()">✕</button></div>
      <div style="flex:1; overflow:auto; text-align:center; padding:10px;">
        ${r.receiptImage.startsWith('data:image/') 
          ? `<img src="${r.receiptImage}" style="max-width:100%; max-height:70vh; border-radius:var(--border-radius-md);" />` 
          : r.receiptImage.startsWith('data:application/pdf')
            ? `<iframe src="${r.receiptImage}" style="width:100%; height:70vh; border:none;"></iframe>`
            : `<a href="${r.receiptImage}" download="receipt" class="btn btn-primary">Download Receipt</a>`}
      </div>
    </div>
  </div>`;
}
window.viewRepaymentReceipt = viewRepaymentReceipt;

// --- AUTOMATED RECEIPT GENERATION & WHATSAPP SHARING ---
function sanitizeForPdf(text) {
  if (!text) return '';
  return text.normalize('NFD').replace(/[^\x00-\x7F]/g, '');
}

function generateReceiptImage(borrowerName, borrowerPhone, amount, date, method, receiptNo, notes, loanBalance) {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border/Outline card style
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Title block background
    ctx.fillStyle = '#1C1844'; // Primary color
    ctx.fillRect(10, 10, canvas.width - 20, 50);

    // Lender Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(sanitizeForPdf(settings.lenderName) || 'LenderBook', 24, 40);

    // Receipt Slip text
    ctx.fillStyle = '#10B981'; // Accent green
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('OFFICIAL RECEIPT', 280, 39);

    // Details
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px sans-serif';
    
    let y = 90;
    ctx.fillText('Receipt No:', 30, y);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#1E293B';
    ctx.fillText(receiptNo, 140, y);

    y += 24;
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('Date:', 30, y);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#1E293B';
    ctx.fillText(date, 140, y);

    y += 24;
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('Borrower:', 30, y);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#1E293B';
    ctx.fillText(`${sanitizeForPdf(borrowerName)} (${borrowerPhone})`, 140, y);

    // Divider
    y += 16;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(canvas.width - 30, y);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Payment details
    y += 26;
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('Amount Paid:', 30, y);
    ctx.fillStyle = '#059669'; // Green
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`Rs. ${amount.toLocaleString('en-IN')}`, 140, y);

    y += 26;
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('Payment Method:', 30, y);
    ctx.fillStyle = '#1E293B';
    ctx.font = '11px sans-serif';
    ctx.fillText(method, 140, y);

    if (notes) {
      y += 24;
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('Notes:', 30, y);
      ctx.fillStyle = '#1E293B';
      ctx.font = '11px sans-serif';
      ctx.fillText(sanitizeForPdf(notes), 140, y);
    }

    y += 24;
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('Remaining Bal:', 30, y);
    ctx.fillStyle = '#2563EB'; // Blue
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`Rs. ${loanBalance.toLocaleString('en-IN')}`, 140, y);

    // Divider
    y += 16;
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(canvas.width - 30, y);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Footer
    y += 24;
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'italic 9px sans-serif';
    ctx.fillText('Thank you for your payment!', 30, y);
    y += 14;
    ctx.fillText('This is a system generated view format copy.', 30, y);

    return canvas.toDataURL('image/png');
  } catch (err) {
    console.error('Canvas error:', err);
    return '';
  }
}

function generateReceiptPdf(borrowerName, borrowerPhone, amount, date, method, receiptNo, notes, loanBalance) {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a6'
    });

    const cleanLender = sanitizeForPdf(settings.lenderName || "LenderBook");
    const cleanBorrower = sanitizeForPdf(borrowerName);
    const cleanNotes = sanitizeForPdf(notes);

    // Header
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(28, 24, 68); // #1C1844
    doc.setFontSize(14);
    doc.text(cleanLender, 10, 15);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("LENDER CONFIRMATION & RECEIPT", 10, 20);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(10, 22, 95, 22);

    // Receipt details
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);
    
    doc.text("Receipt No:", 10, 30);
    doc.setFont("Helvetica", "normal");
    doc.text(receiptNo, 40, 30);

    doc.setFont("Helvetica", "bold");
    doc.text("Date:", 10, 36);
    doc.setFont("Helvetica", "normal");
    doc.text(date, 40, 36);

    doc.setFont("Helvetica", "bold");
    doc.text("Borrower:", 10, 42);
    doc.setFont("Helvetica", "normal");
    doc.text(`${cleanBorrower} (${borrowerPhone})`, 40, 42);

    doc.setDrawColor(220, 220, 220);
    doc.line(10, 46, 95, 46);

    // Payment details
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Amount Paid:", 10, 54);
    doc.setTextColor(59, 109, 17); // Green #3B6D11
    doc.setFontSize(11);
    doc.text(`Rs. ${amount.toLocaleString('en-IN')}`, 40, 54);
    
    doc.setFontSize(9);
    doc.setTextColor(50, 50, 50);

    doc.setFont("Helvetica", "bold");
    doc.text("Payment Method:", 10, 62);
    doc.setFont("Helvetica", "normal");
    doc.text(method, 40, 62);

    if (cleanNotes) {
      doc.setFont("Helvetica", "bold");
      doc.text("Notes:", 10, 70);
      doc.setFont("Helvetica", "normal");
      doc.text(cleanNotes, 40, 70);
    }

    doc.setFont("Helvetica", "bold");
    doc.text("Remaining Bal:", 10, 78);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(24, 95, 165); // #185FA5
    doc.text(`Rs. ${loanBalance.toLocaleString('en-IN')}`, 40, 78);
    doc.setTextColor(50, 50, 50);

    doc.setDrawColor(200, 200, 200);
    doc.line(10, 84, 95, 84);

    // Footer
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("Thank you for your payment!", 10, 90);
    doc.setFont("Helvetica", "normal");
    doc.text("This is an electronically generated document.", 10, 94);

    return doc.output('datauristring');
  } catch (err) {
    console.error('Error generating PDF:', err);
    return '';
  }
}

async function shareRepaymentReceipt(repaymentId) {
  const r = repayments.find(x => x.id === repaymentId);
  if (!r) {
    showToast('Receipt not found');
    return;
  }
  const b = borrowers.find(x => x.id === r.borrowerId);
  const l = loans.find(x => x.id === r.loanId);
  if (!b || !l) return;

  const receiptNo = r.receipt;
  const cleanPhone = b.phone.replace(/\D/g, '');
  const finalPhone = cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone;
  
  showToast('Preparing automated WhatsApp message...', 3000);

  let pdfLink = '';
  try {
    const stats = getLoanStats(l);
    const pdfBase64 = generateReceiptPdf(
      b.name,
      b.phone,
      r.amount,
      r.paidOn,
      r.method,
      r.receipt,
      r.notes,
      stats.amountLeft
    );

    if (pdfBase64) {
      const base64Data = pdfBase64.split(',')[1];
      const pdfBlob = base64toBlob(base64Data, 'application/pdf');
      const publicUrl = await uploadReceiptFile(`Receipt-${receiptNo}.pdf`, pdfBlob);
      if (publicUrl) {
        pdfLink = publicUrl;
      }
    }
  } catch (err) {
    console.error('Failed to generate or upload PDF receipt:', err);
  }

  // Pre-fill text with the PDF link
  const shareMsg = `Dear ${b.name}, payment of ${fmt(r.amount)} received on ${r.paidOn} via ${r.method}. Receipt #${r.receipt}.${pdfLink ? ` View PDF Receipt: ${pdfLink}` : ''} Thank you! - ${settings.lenderName || "LenderBook"}`;
  
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(shareMsg)}`;
  window.open(whatsappUrl, '_blank');
  showToast('WhatsApp opened!');
}

function base64toBlob(base64Data, contentType) {
  contentType = contentType || '';
  const sliceSize = 1024;
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }
  return new Blob(byteArrays, { type: contentType });
}

window.shareRepaymentReceipt = shareRepaymentReceipt;


async function closeLoan(id) {
  await updateLoanStatus(id, 'CLOSED');
  await refreshData();
  showToast('Loan closed');
  renderPage(currentPage);
}

function saveSettings() {
  settings.lenderName = document.getElementById('s-lenderName').value || settings.lenderName;
  settings.fatherPhone = document.getElementById('s-fatherPhone').value.trim();
  settings.fatherUpiId = (document.getElementById('s-fatherUpiId')?.value || '').trim();
  settings.upiAutoDetect = document.getElementById('s-upiAutoDetect')?.value === 'true';
  settings.appPassword = (document.getElementById('s-app-password')?.value || '').trim();
  
  const dbUrlInput = document.getElementById('s-dbUrl');
  const dbKeyInput = document.getElementById('s-dbKey');
  if (dbUrlInput && dbKeyInput) {
    const dbUrl = dbUrlInput.value.trim();
    const dbKey = dbKeyInput.value.trim();
    setCredentials(dbUrl, dbKey);
  }

  const newLang = document.getElementById('s-lang').value;
  if (newLang !== lang) {
    lang = newLang;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.lang-btn[onclick="window.setLang('${lang}')"]`)?.classList.add('active');
  }
  updateLenderNameUI();
  
  localStorage.setItem('lenderbook_settings', JSON.stringify(settings));
  showToast('Settings saved');
  
  refreshData().then(() => {
    nav('settings');
  });
}

function closeModal() {
  document.getElementById('modal-container').innerHTML = '';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (t) {
    t.textContent = msg;
    t.style.display = 'block';
    setTimeout(() => { t.style.display = 'none' }, 2500);
  }
}

// --- WHATSAPP NOTIFICATION ---
function sendWhatsAppFather() {
  const overdueList = loans.filter(l => {
    const out = calcOutstanding(l);
    if (out <= 0) return false;
    const nowStr = new Date().toISOString().split('T')[0];
    return l.status === 'OVERDUE' || l.status === 'DEFAULTED' || l.dueDate < nowStr;
  });

  if (overdueList.length === 0) {
    showToast('No overdue loans found!');
    return;
  }

  let text = `*${settings.lenderName} — Overdues Report*\nDate: ${new Date().toLocaleDateString()}\n\n`;
  overdueList.forEach((l, index) => {
    const b = borrowers.find(x => x.id === l.borrowerId);
    const name = b ? b.name : 'Unknown';
    const phone = b ? b.phone : '';
    const stats = getLoanStats(l);
    text += `*${index + 1}. ${name}*\n`;
    if (phone) text += `   Phone: ${phone}\n`;
    text += `   Loan Amount: ${fmt(l.principal)}\n`;
    text += `   Paid so far: ${fmt(stats.totalPaid)}\n`;
    text += `   Left to Pay: ${fmt(stats.amountLeft)}\n`;
    text += `   Due Date: ${l.dueDate}\n\n`;
  });

  const fatherPhone = settings.fatherPhone ? settings.fatherPhone.replace(/\D/g, '') : '';
  const url = `https://api.whatsapp.com/send?${fatherPhone ? 'phone=' + fatherPhone + '&' : ''}text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
  showToast('WhatsApp report generated!');
}

// --- UPI AUTO-DETECTION FUNCTIONS ---

function renderUpiPendingPayments() {
  const pending = upiPayments.filter(p => p.status === 'PENDING');
  if (pending.length === 0) {
    return `<div style="text-align:center; padding:16px; color:var(--color-text-tertiary); font-size:12px;">
      <i class="ti ti-inbox" style="font-size:24px; display:block; margin-bottom:6px;"></i>
      No pending UPI payments. Paste a bank SMS above to detect payments.
    </div>`;
  }

  return pending.map(p => {
    const matched = p.borrowerId ? borrowers.find(b => b.id === p.borrowerId) : null;
    const matchedByVpa = !matched ? matchVPAToBorrower(p.upiVpa, borrowers.map(b => ({ ...b, vpa: b.upiVpa }))) : null;
    const suggestedBorrower = matched || matchedByVpa;
    
    return `
    <div style="border:0.5px solid ${suggestedBorrower ? '#85B7EB' : '#F09595'}; border-radius:var(--border-radius-md); padding:12px; margin-bottom:8px; background:${suggestedBorrower ? '#F0F7FD' : '#FFF5F5'};">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <div>
          <span style="font-weight:600; color:#185FA5; font-size:15px;">${fmt(p.amount)}</span>
          <span style="font-size:11px; color:var(--color-text-tertiary); margin-left:8px;">via ${p.upiVpa}</span>
        </div>
        <span style="font-size:10px; color:var(--color-text-tertiary);">${new Date(p.detectedAt).toLocaleString()}</span>
      </div>
      ${suggestedBorrower ? `
        <div style="font-size:12px; margin-bottom:8px; color:#185FA5;">
          <i class="ti ti-user-check"></i> Matched: <strong>${suggestedBorrower.name}</strong> ${suggestedBorrower.village ? `(${suggestedBorrower.village})` : ''}
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-sm btn-primary" onclick="window.confirmUpiPayment(${p.id}, ${suggestedBorrower.id}, this)">
            <i class="ti ti-check"></i> Confirm & Log
          </button>
          <button class="btn btn-sm btn-danger" onclick="window.rejectUpiPayment(${p.id}, this)">
            <i class="ti ti-x"></i> Reject
          </button>
          <button class="btn btn-sm" onclick="window.showAssignUpiPayment(${p.id})">
            <i class="ti ti-switch-horizontal"></i> Wrong Person
          </button>
        </div>
      ` : `
        <div style="font-size:12px; margin-bottom:8px; color:#A32D2D;">
          <i class="ti ti-alert-circle"></i> Unknown UPI VPA — select the borrower manually
        </div>
        <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
          <select id="upi-assign-${p.id}" style="width:200px; padding:5px 8px; font-size:12px;">
            <option value="">Select borrower...</option>
            ${borrowers.filter(b => b.isActive).map(b => `<option value="${b.id}">${b.name}${b.village ? ' (' + b.village + ')' : ''}</option>`).join('')}
          </select>
          <button class="btn btn-sm btn-primary" onclick="window.assignAndConfirmUpiPayment(${p.id}, this)">
            <i class="ti ti-check"></i> Assign & Log
          </button>
          <button class="btn btn-sm btn-danger" onclick="window.rejectUpiPayment(${p.id}, this)">
            <i class="ti ti-x"></i> Not a borrower
          </button>
        </div>
      `}
    </div>`;
  }).join('');
}

function renderVillageCollection() {
  const villages = [...new Set(borrowers.filter(b => b.village && b.isActive).map(b => b.village))];
  if (villages.length === 0) {
    return `<div style="text-align:center; padding:16px; color:var(--color-text-tertiary); font-size:12px;">
      <i class="ti ti-map-pin-off" style="font-size:24px; display:block; margin-bottom:6px;"></i>
      Add villages to borrowers to see collection routes.
    </div>`;
  }

  const selectedVillage = window._selectedVillage || '';
  
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDay = days[new Date().getDay()];
  const selectedDay = window._selectedCollectionDay || todayDay;
  const daysList = ['All', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  let html = `
  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px; align-items:center;">
    <span style="font-size:11px; font-weight:600; color:var(--color-text-secondary); width:50px;">Village:</span>
    <button class="btn btn-sm ${!selectedVillage ? 'btn-primary' : ''}" onclick="window.selectVillage('')">All</button>
    ${villages.map(v => `<button class="btn btn-sm ${selectedVillage === v ? 'btn-primary' : ''}" onclick="window.selectVillage('${v}')">${v}</button>`).join('')}
  </div>
  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; border-top:0.5px solid var(--color-border-tertiary); padding-top:8px; align-items:center;">
    <span style="font-size:11px; font-weight:600; color:var(--color-text-secondary); width:50px;">Day:</span>
    ${daysList.map(d => `<button class="btn btn-sm ${selectedDay === d ? 'btn-primary' : ''}" onclick="window.selectCollectionDay('${d}')">${d}</button>`).join('')}
  </div>`;

  const todayStr = new Date().toISOString().split('T')[0];
  const villageBorrowers = borrowers.filter(b => {
    if (!b.isActive) return false;
    if (selectedVillage && b.village !== selectedVillage) return false;
    
    // Once collected today, remove from this list
    const hasPaidToday = repayments.some(r => r.borrowerId === b.id && r.paidOn === todayStr);
    if (hasPaidToday) return false;
    
    // Filter by Collection Day
    if (selectedDay !== 'All') {
      if (b.collectionDay && b.collectionDay !== 'Any Day' && b.collectionDay !== selectedDay) {
        return false;
      }
    }
    
    // Only show borrowers with active/overdue loans
    return loans.some(l => l.borrowerId === b.id && ['ACTIVE', 'OVERDUE', 'DEFAULTED'].includes(l.status) && calcOutstanding(l) > 0);
  });

  if (villageBorrowers.length === 0) {
    html += `<div style="text-align:center; padding:12px; color:var(--color-text-tertiary); font-size:12px;">No dues pending${selectedVillage ? ' in ' + selectedVillage : ''}${selectedDay !== 'All' ? ' for ' + selectedDay : ''}.</div>`;
    return html;
  }

  html += villageBorrowers.map(b => {
    const bLoans = loans.filter(l => l.borrowerId === b.id && ['ACTIVE', 'OVERDUE', 'DEFAULTED'].includes(l.status));
    const totalDue = bLoans.reduce((s, l) => s + calcOutstanding(l), 0);
    const emi = bLoans.reduce((s, l) => s + (l.repaymentAmount || 0), 0);
    const isOverdue = bLoans.some(l => l.status === 'OVERDUE' || l.status === 'DEFAULTED' || l.dueDate < new Date().toISOString().split('T')[0]);
    
    return `<div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-radius:var(--border-radius-md); margin-bottom:4px; background:${isOverdue ? '#FFF5F5' : 'var(--color-background-secondary)'}; border:0.5px solid ${isOverdue ? '#F09595' : 'var(--color-border-tertiary)'};">
      <div>
        <div style="font-size:13px; font-weight:500;">${b.name} <span style="font-size:10px; color:var(--color-text-tertiary);">${b.village} (${b.collectionDay || 'Any Day'})</span></div>
        <div style="font-size:11px; color:var(--color-text-secondary);">Repayment: ${fmt(emi)} · Dues Left: ${fmt(totalDue)}</div>
      </div>
      <div style="display:flex; gap:6px;">
        <button class="btn btn-sm btn-primary" onclick="window.quickCollect(${b.id})" style="font-size:11px;">
          <i class="ti ti-cash"></i> Collect
        </button>
      </div>
    </div>`;
  }).join('');

  return html;
}

async function handleSMSPaste() {
  const smsInput = document.getElementById('sms-paste-input');
  if (!smsInput) return;
  const smsText = smsInput.value.trim();
  if (!smsText) {
    showToast('Please paste a bank SMS first');
    return;
  }

  const result = parseBankSMS(smsText);
  if (!result.parsed || !result.amount) {
    showToast('Could not parse SMS. Make sure it is a bank credit notification.');
    return;
  }

  // Try to match VPA to a borrower
  let matchedBorrowerId = null;
  if (result.senderVPA) {
    const matched = matchVPAToBorrower(result.senderVPA, borrowers.map(b => ({ ...b, vpa: b.upiVpa })));
    if (matched) matchedBorrowerId = matched.id;
  }

  // Add to UPI auto payments
  await addUpiPayment({
    borrowerId: matchedBorrowerId,
    amount: result.amount,
    upiVpa: result.senderVPA || 'unknown',
    bankSmsText: smsText,
    status: 'PENDING'
  });

  await refreshData();
  smsInput.value = '';
  
  const matched = matchedBorrowerId ? borrowers.find(b => b.id === matchedBorrowerId) : null;
  if (matched) {
    showToast(`Payment detected: ${fmt(result.amount)} from ${matched.name} ✓`);
  } else {
    showToast(`Payment detected: ${fmt(result.amount)} — assign to a borrower`);
  }
  renderPage('dashboard');
}

function loadSampleSMS() {
  const smsInput = document.getElementById('sms-paste-input');
  if (!smsInput) return;
  const randomIdx = Math.floor(Math.random() * SAMPLE_SMS.length);
  smsInput.value = SAMPLE_SMS[randomIdx];
  showToast('Sample SMS loaded — click "Detect Payment"');
}

async function confirmUpiPayment(paymentId, borrowerId, btnEl) {
  const isAssign = btnEl && btnEl.innerHTML.includes('Assign');
  if (btnEl) {
    if (btnEl.disabled) return;
    btnEl.disabled = true;
    btnEl.innerHTML = '<i class="ti ti-loader rotate"></i> Logging...';
  }

  try {
    const payment = upiPayments.find(p => p.id === paymentId);
    if (!payment) {
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerHTML = isAssign ? '<i class="ti ti-check"></i> Assign & Log' : '<i class="ti ti-check"></i> Confirm & Log';
      }
      return;
    }

    // Find the borrower's active loan
    const b = borrowers.find(x => x.id === borrowerId);
    const activeLoan = loans.find(l => l.borrowerId === borrowerId && ['ACTIVE', 'OVERDUE', 'DEFAULTED'].includes(l.status));
    
    if (!activeLoan) {
      showToast('No active loan found for this borrower');
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.innerHTML = isAssign ? '<i class="ti ti-check"></i> Assign & Log' : '<i class="ti ti-check"></i> Confirm & Log';
      }
      return;
    }

    // Auto-log as a repayment
    const receipt = 'UPI-' + String(nextRepaymentId++).padStart(3, '0');
    const newRepayment = await addRepayment({
      loanId: activeLoan.id,
      borrowerId: borrowerId,
      amount: payment.amount,
      paidOn: new Date().toISOString().split('T')[0],
      method: 'UPI',
      notes: `Auto-detected from ${payment.upiVpa}`,
      receipt
    });

    // Update UPI payment status
    await updateUpiPaymentStatus(paymentId, 'CONFIRMED', borrowerId, newRepayment?.id);

    // Save the VPA mapping if not already saved
    if (b && payment.upiVpa && !b.upiVpa.includes(payment.upiVpa)) {
      const newVpa = b.upiVpa ? b.upiVpa + ', ' + payment.upiVpa : payment.upiVpa;
      await updateBorrower(borrowerId, { upiVpa: newVpa });
    }

    await refreshData();
    showToast(`${fmt(payment.amount)} logged for ${b ? b.name : 'Borrower'} ✓`);
    renderPage('dashboard');
  } catch (e) {
    console.error(e);
    showToast('Failed to confirm payment: ' + (e.message || e));
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.innerHTML = isAssign ? '<i class="ti ti-check"></i> Assign & Log' : '<i class="ti ti-check"></i> Confirm & Log';
    }
  }
}

async function rejectUpiPayment(paymentId, btnEl) {
  if (btnEl) {
    if (btnEl.disabled) return;
    btnEl.disabled = true;
    btnEl.innerHTML = '<i class="ti ti-loader rotate"></i> ...';
  }

  try {
    await updateUpiPaymentStatus(paymentId, 'REJECTED');
    await refreshData();
    showToast('Payment rejected');
    renderPage('dashboard');
  } catch (e) {
    console.error(e);
    showToast('Failed to reject payment');
    if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = '<i class="ti ti-x"></i> Reject'; }
  }
}

function showAssignUpiPayment(paymentId) {
  const payment = upiPayments.find(p => p.id === paymentId);
  if (!payment) return;
  
  const options = borrowers.filter(b => b.isActive).map(b => 
    `<option value="${b.id}">${b.name}${b.village ? ' (' + b.village + ')' : ''}</option>`
  ).join('');

  document.getElementById('modal-container').innerHTML = `
  <div class="modal-overlay">
    <div class="modal">
      <div class="modal-title">Assign Payment to Borrower<button class="btn btn-sm" onclick="window.closeModal()">✕</button></div>
      <div style="background:var(--color-background-secondary); padding:12px; border-radius:var(--border-radius-md); margin-bottom:14px;">
        <div style="font-size:14px; font-weight:600; color:#185FA5;">${fmt(payment.amount)}</div>
        <div style="font-size:12px; color:var(--color-text-secondary);">from UPI VPA: ${payment.upiVpa}</div>
      </div>
      <div class="form-row">
        <label class="form-label">Select Borrower *</label>
        <select id="m-upi-assign-borrower">${options}</select>
      </div>
      <div class="form-row">
        <label class="form-label" style="display:flex; align-items:center; gap:6px;">
          <input type="checkbox" id="m-upi-save-vpa" checked style="width:auto;"> Remember this UPI VPA for future payments
        </label>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-primary" onclick="window.doAssignUpiPayment(${paymentId})">
          <i class="ti ti-check"></i> Confirm & Log Repayment
        </button>
        <button class="btn" onclick="window.closeModal()">${t('cancel')}</button>
      </div>
    </div>
  </div>`;
}

async function doAssignUpiPayment(paymentId) {
  const saveBtn = document.querySelector('#modal-container button.btn-primary');
  if (saveBtn) {
    if (saveBtn.disabled) return;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="ti ti-loader rotate"></i> Saving...';
  }
  
  try {
    const borrowerId = +document.getElementById('m-upi-assign-borrower').value;
    const saveVpa = document.getElementById('m-upi-save-vpa').checked;
    if (!borrowerId) {
      showToast('Please select a borrower');
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Confirm & Log Repayment';
      }
      return;
    }
    closeModal();
    
    if (saveVpa) {
      const payment = upiPayments.find(p => p.id === paymentId);
      const b = borrowers.find(x => x.id === borrowerId);
      if (payment && b && payment.upiVpa && !b.upiVpa.includes(payment.upiVpa)) {
        const newVpa = b.upiVpa ? b.upiVpa + ', ' + payment.upiVpa : payment.upiVpa;
        await updateBorrower(borrowerId, { upiVpa: newVpa });
      }
    }
    
    await confirmUpiPayment(paymentId, borrowerId);
  } catch (e) {
    console.error(e);
    showToast('Failed to assign payment');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = 'Confirm & Log Repayment';
    }
  }
}

async function assignAndConfirmUpiPayment(paymentId, btnEl) {
  try {
    const selectEl = document.getElementById(`upi-assign-${paymentId}`);
    if (!selectEl || !selectEl.value) {
      showToast('Please select a borrower first');
      return;
    }
    const borrowerId = +selectEl.value;
    
    // Save the VPA for future
    const payment = upiPayments.find(p => p.id === paymentId);
    const b = borrowers.find(x => x.id === borrowerId);
    if (payment && b && payment.upiVpa && !b.upiVpa.includes(payment.upiVpa)) {
      const newVpa = b.upiVpa ? b.upiVpa + ', ' + payment.upiVpa : payment.upiVpa;
      await updateBorrower(borrowerId, { upiVpa: newVpa });
    }
    
    await confirmUpiPayment(paymentId, borrowerId, btnEl);
  } catch (e) {
    console.error(e);
    showToast('Failed to assign payment: ' + (e.message || e));
  }
}

function selectVillage(village) {
  window._selectedVillage = village;
  renderPage('dashboard');
}

function selectCollectionDay(day) {
  window._selectedCollectionDay = day;
  renderPage('dashboard');
}
window.selectCollectionDay = selectCollectionDay;

function quickCollect(borrowerId) {
  const activeLoan = loans.find(l => l.borrowerId === borrowerId && ['ACTIVE', 'OVERDUE', 'DEFAULTED'].includes(l.status));
  if (activeLoan) {
    showLogRepayment(activeLoan.id, borrowerId);
  } else {
    showToast('No active loan for this borrower');
  }
}

function clearLocalData() {
  if (confirm('Are you sure you want to delete all local/demo data? This will clear all local storage records and restart the app.')) {
    localStorage.removeItem('lb_borrowers');
    localStorage.removeItem('lb_loans');
    localStorage.removeItem('lb_repayments');
    localStorage.removeItem('lb_msgs');
    localStorage.removeItem('lb_upi_payments');
    showToast('Local data cleared! Reloading...');
    setTimeout(() => {
      window.location.reload();
    }, 1200);
  }
}

// --- ACCORDION TOGGLING ---
function toggleRepaymentDetails(borrowerId) {
  const content = document.getElementById(`rep-content-${borrowerId}`);
  const icon = document.getElementById(`rep-icon-${borrowerId}`);
  if (content) {
    const isHidden = content.style.display === 'none' || content.style.display === '';
    content.style.display = isHidden ? 'block' : 'none';
    if (icon) {
      icon.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
      icon.textContent = '▼'; // Update visually as well
      if (!isHidden) icon.textContent = '▶';
    }
  }
}

// --- EXPOSE INTERFACE GLOBALLY FOR INLINE ONCLICK HANDLERS ---
window.nav = nav;
window.setLang = setLang;
window.showAddBorrower = showAddBorrower;
window.saveBorrower = saveBorrower;
window.showEditBorrower = showEditBorrower;
window.saveEditedBorrower = saveEditedBorrower;
window.showAddLoan = showAddLoan;
window.saveLoan = saveLoan;
window.showLogRepayment = showLogRepayment;
window.saveRepayment = saveRepayment;
window.showSendMessage = showSendMessage;
window.showReminderModal = showSendMessage;
window.sendDirectWhatsApp = sendDirectWhatsApp;
window.sendDirectSMS = sendDirectSMS;
window.sendManualMessage = sendManualMessage;
window.closeLoan = closeLoan;
window.saveSettings = saveSettings;
window.closeModal = closeModal;
window.toggleRepaymentDetails = toggleRepaymentDetails;
window.sendWhatsAppFather = sendWhatsAppFather;
window.searchQ = searchQ;
window.renderPage = renderPage;
window.clearLocalData = clearLocalData;
window.selectVillage = selectVillage;
window.quickCollect = quickCollect;
window.handleSMSPaste = handleSMSPaste;
window.loadSampleSMS = loadSampleSMS;
window.confirmUpiPayment = confirmUpiPayment;
window.rejectUpiPayment = rejectUpiPayment;
window.showAssignUpiPayment = showAssignUpiPayment;
window.doAssignUpiPayment = doAssignUpiPayment;
window.assignAndConfirmUpiPayment = assignAndConfirmUpiPayment;
window.updateRepaymentPrefill = updateRepaymentPrefill;
window.sendAllWhatsAppReminders = sendAllWhatsAppReminders;
window.viewSignedDoc = viewSignedDoc;
window.viewRepaymentReceipt = viewRepaymentReceipt;
window.updateReminderPreview = updateReminderPreview;

function showPasswordLockOverlay() {
  document.getElementById('app').style.filter = 'blur(10px)';
  
  const overlay = document.createElement('div');
  overlay.id = 'password-lock-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(15, 23, 42, 0.96)';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '99999';
  overlay.style.color = '#fff';
  overlay.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  overlay.style.padding = '20px';
  overlay.style.boxSizing = 'border-box';
  
  overlay.innerHTML = `
    <div style="background: #1E293B; padding: 32px; border-radius: 12px; max-width: 380px; width: 100%; text-align: center; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
      <div style="width: 56px; height: 56px; line-height: 56px; border-radius: 50%; font-size: 24px; margin: 0 auto 16px auto; background: #534AB7; color: #fff; display: flex; align-items: center; justify-content: center;">
        <i class="ti ti-lock" style="font-size: 28px;"></i>
      </div>
      <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px; color: #fff;">LenderBook Secured</h2>
      <p style="font-size: 13px; color: #94A3B8; margin-bottom: 24px; line-height: 1.4;">Please enter the password set by ${settings.lenderName || 'lender'} to unlock access.</p>
      
      <div style="margin-bottom: 16px; text-align: left;">
        <input type="password" id="lock-pass-input" placeholder="Password" style="width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid #475569; background: #0F172A; color: #fff; box-sizing: border-box; font-size: 14px; outline: none;" />
      </div>
      
      <button class="btn btn-primary" onclick="window.unlockApp()" style="width: 100%; justify-content: center; font-size: 14px; padding: 10px 16px; height: 40px; font-weight: 600;">
        Unlock Application
      </button>
      
      <div id="lock-error-msg" style="color: #EF4444; font-size: 12px; margin-top: 12px; min-height: 18px; font-weight: 500;"></div>
    </div>
  `;
  document.body.appendChild(overlay);
  
  const passInput = document.getElementById('lock-pass-input');
  if (passInput) {
    passInput.focus();
    passInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') unlockApp();
    });
  }
}

function initRealtimeSms() {
  subscribeToRealtimeSms(async (newSms) => {
    await processIncomingSmsRow(newSms);
    await refreshData();
    renderPage(currentPage);
  });
}

function unlockApp() {
  const input = document.getElementById('lock-pass-input').value;
  const errorEl = document.getElementById('lock-error-msg');
  if (input === settings.appPassword) {
    sessionStorage.setItem('lb_authenticated', 'true');
    const overlay = document.getElementById('password-lock-overlay');
    if (overlay) overlay.remove();
    document.getElementById('app').style.filter = 'none';
    refreshData().then(() => {
      nav('dashboard');
      initRealtimeSms();
    });
  } else {
    if (errorEl) {
      errorEl.textContent = 'Incorrect password. Please try again.';
      setTimeout(() => { errorEl.textContent = ''; }, 3000);
    }
  }
}

window.unlockApp = unlockApp;
window.showPasswordLockOverlay = showPasswordLockOverlay;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  updateLenderNameUI();
  
  if (settings.appPassword && !sessionStorage.getItem('lb_authenticated')) {
    showPasswordLockOverlay();
  } else {
    refreshData().then(() => {
      nav('dashboard');
      initRealtimeSms();
    });
  }
});
