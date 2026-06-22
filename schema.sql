-- Supabase Database Schema for LenderBook
-- Copy and run this SQL inside the Supabase SQL Editor for your project.

-- 1. Create Borrowers Table
CREATE TABLE IF NOT EXISTS public.borrowers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    village TEXT,
    upi_vpa TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Loans Table
CREATE TABLE IF NOT EXISTS public.loans (
    id SERIAL PRIMARY KEY,
    borrower_id INT REFERENCES public.borrowers(id) ON DELETE CASCADE,
    principal NUMERIC NOT NULL,
    rate NUMERIC NOT NULL,
    tenure INT NOT NULL,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'OVERDUE', 'CLOSED', 'DEFAULTED')),
    collateral TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Repayments Table
CREATE TABLE IF NOT EXISTS public.repayments (
    id SERIAL PRIMARY KEY,
    loan_id INT REFERENCES public.loans(id) ON DELETE CASCADE,
    borrower_id INT REFERENCES public.borrowers(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    paid_on DATE NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('CASH', 'UPI', 'BANK')),
    notes TEXT,
    receipt TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id SERIAL PRIMARY KEY,
    borrower_id INT REFERENCES public.borrowers(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sent_at TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('SENT', 'RECEIVED')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create UPI Auto Payments Table
CREATE TABLE IF NOT EXISTS public.upi_auto_payments (
    id SERIAL PRIMARY KEY,
    borrower_id INT REFERENCES public.borrowers(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    upi_vpa TEXT,
    bank_sms_text TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED')),
    linked_repayment_id INT REFERENCES public.repayments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
