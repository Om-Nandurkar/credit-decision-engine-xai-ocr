# 🧠 FynXai: Explainable Credit Decision Engine

_A document-driven credit scoring system using OCR, machine learning, and explainable AI for transparent and reliable lending decisions._

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg" />
  <img src="https://img.shields.io/badge/AI-XGBoost-orange.svg" />
  <img src="https://img.shields.io/badge/XAI-SHAP%20%7C%20LIME-blue.svg" />
  <img src="https://img.shields.io/badge/Frontend-React-61DAFB.svg" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-green.svg" />
</p>

---

## 📖 Table of Contents

- [📝 Project Overview](#-project-overview)
- [✨ Key Features](#-key-features)
- [🏛️ System Architecture](#-system-architecture)
- [🛠️ Technologies Used](#-technologies-used)
- [🚀 Getting Started](#-getting-started)
- [📸 Screenshots](#-screenshots)

---

## 📝 Project Overview

### The Challenge

Traditional credit scoring systems rely primarily on structured datasets and rule-based approaches.
These systems often fail to leverage valuable financial information present in real-world documents such as bank statements, salary slips, and identity proofs.
Additionally, modern machine learning models improve prediction accuracy but introduce a lack of transparency in decision-making.

---

### The Solution

FynXai provides an integrated framework that combines document intelligence with explainable machine learning.

The system:

- Extracts financial and identity data from documents using OCR and PDF parsing
- Converts extracted data into structured financial features
- Applies an XGBoost model to predict credit scores and loan eligibility
- Generates explanations using SHAP and LIME
- Supports human-in-the-loop validation for final decision making

---

## ✨ Key Features

- 📄 **Document Processing**
  Extraction of structured data from financial and identity documents using OCR and PDF parsing.

- 🧮 **Feature Engineering**
  Generation of financial and behavioral attributes representing applicant creditworthiness.

- 🤖 **Credit Scoring Model**
  XGBoost-based model for accurate credit score prediction.

- 🔍 **Explainable AI**
  SHAP and LIME provide global and instance-level interpretability.

- 👨‍⚖️ **Decision Support System**
  Loan officer review ensures accountability and validation.

- 🔐 **Integrated Backend & Storage**
  Supabase-based authentication and structured data storage.

---

## 🏛️ System Architecture

FynXai follows a layered architecture designed for scalability and transparency:

1. **Frontend Layer**
   Built using React and Vite, providing interfaces for applicants and loan officers.

2. **Backend API Layer**
   FastAPI-based services handling document processing, scoring, and explainability.

3. **Document Processing Layer**
   OCR (EasyOCR) and PDF parsing (PyPDF2, pdfplumber) extract structured data.

4. **Feature Engineering Layer**
   Transforms extracted data into standardized financial attributes.

5. **Prediction Layer**
   XGBoost model generates credit scores and eligibility decisions.

6. **Explainability Layer**
   SHAP and LIME interpret model predictions.

7. **Decision Layer**
   Loan officer reviews results and finalizes decisions.

---

## 🛠️ Technologies Used

- **Frontend**: React (Vite + TypeScript), Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python
- **Machine Learning**: XGBoost
- **OCR & Parsing**: EasyOCR, PyPDF2, pdfplumber
- **Explainability**: SHAP, LIME
- **Database**: Supabase (PostgreSQL)

---

## 🚀 Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- Supabase project

---

### 1. Database Setup

Before running the application, configure your Supabase database. Run the following SQL queries in your Supabase SQL Editor to create the tables, establish relationships, and apply Row Level Security (RLS) policies.

<details>
<summary><b>Click to expand SQL Schema & Policies</b></summary>

```sql
-- ==========================================
-- 1. TABLE CREATION
-- ==========================================

CREATE TABLE public.users (
  id uuid NOT NULL,
  first_name text,
  last_name text,
  email text,
  phone_number text,
  role text DEFAULT 'Applicant'::text CHECK (role = ANY (ARRAY['Applicant'::text, 'Admin'::text, 'Officer'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  deletion_requested boolean DEFAULT false,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE public.loans (
  application_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  first_name text,
  last_name text,
  email text,
  phone_number text,
  date_of_birth date,
  pan_number text,
  loan_amount numeric,
  loan_tenure integer,
  loan_purpose text,
  monthly_income numeric,
  credit_score integer,
  loan_status text DEFAULT 'Pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  document_urls jsonb DEFAULT '{}'::jsonb,
  officer_comments jsonb DEFAULT '[]'::jsonb,
  officer_decision text,
  review_count integer DEFAULT 0,
  sanctioned_amount numeric,
  interest_rate numeric,
  CONSTRAINT loans_pkey PRIMARY KEY (application_id),
  CONSTRAINT loans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE public.xai_data (
  explanation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  shap_values jsonb,
  top_contributing_factor text,
  explanation_output text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  ocr_json jsonb,
  status text DEFAULT 'pending'::text,
  model_json jsonb,
  lime_values jsonb DEFAULT '[]'::jsonb,
  counterfactuals jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT xai_data_pkey PRIMARY KEY (explanation_id),
  CONSTRAINT xai_data_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.loans(application_id) ON DELETE CASCADE
);

CREATE TABLE public.support (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  application_id uuid,
  subject text NOT NULL,
  message text NOT NULL,
  evidence_path text,
  status text DEFAULT 'Open'::text,
  CONSTRAINT support_pkey PRIMARY KEY (id),
  CONSTRAINT support_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_support_application FOREIGN KEY (application_id) REFERENCES public.loans(application_id) ON DELETE CASCADE
);

CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  application_id uuid UNIQUE,
  is_helpful boolean NOT NULL,
  CONSTRAINT feedback_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT feedback_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.loans(application_id) ON DELETE CASCADE
);

-- ==========================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xai_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 3. RLS POLICIES
-- ==========================================

-- USERS Table Policies
CREATE POLICY "Admins can delete users" ON public.users FOR DELETE TO public USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'Admin');
CREATE POLICY "Admins can insert users" ON public.users FOR INSERT TO public WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'Admin');
CREATE POLICY "Allow authenticated read users" ON public.users FOR SELECT TO public USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE TO public USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT TO public USING (auth.uid() = id);

-- LOANS Table Policies
CREATE POLICY "Admins can view all loans" ON public.loans FOR SELECT TO public USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'Admin');
CREATE POLICY "Officers can update loans" ON public.loans FOR UPDATE TO public USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'Officer');
CREATE POLICY "Officers can view all loans" ON public.loans FOR SELECT TO public USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'Officer');
CREATE POLICY "Users can insert loans" ON public.loans FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own loans" ON public.loans FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own loans" ON public.loans FOR ALL TO public USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- XAI_DATA Table Policies
CREATE POLICY "Officers can view xai_data" ON public.xai_data FOR SELECT TO public USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'Officer');
CREATE POLICY "Users can view own explanations" ON public.xai_data FOR SELECT TO public USING (application_id IN (SELECT application_id FROM public.loans WHERE user_id = auth.uid()));
CREATE POLICY "Users can view their own xai_data" ON public.xai_data FOR ALL TO public USING (application_id IN (SELECT application_id FROM public.loans WHERE user_id = auth.uid())) WITH CHECK (application_id IN (SELECT application_id FROM public.loans WHERE user_id = auth.uid()));

-- SUPPORT Table Policies
CREATE POLICY "Enable insert for authenticated users" ON public.support FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable read access for authenticated users" ON public.support FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable update access for authenticated users" ON public.support FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- FEEDBACK Table Policies
CREATE POLICY "Enable insert for authenticated users" ON public.feedback FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Enable read access for authenticated users" ON public.feedback FOR SELECT TO authenticated USING (true);
```
</details>

---

### 2. Clone the Repository

```bash
git clone https://github.com/Hrishit-Patil/credit-decision-engine-xai-ocr.git
cd credit-decision-engine-xai-ocr.git
```

---

### 3. Environment Configuration

Backend `.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Frontend `.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
VITE_API_BASE_URL=http://localhost:8000
```

---

### 4. Backend Setup

```bash
cd backend

python -m venv venv
source venv/bin/activate        # macOS/Linux
# .\venv\Scripts\activate      # Windows

pip install -r requirements.txt
cp .env.example .env
```

Run the backend server:

```bash
uvicorn main:app --reload
```

Backend will run at:

```
http://localhost:8000
```

---

### 5. Frontend Setup

```bash
cd frontend

npm install
cp supabaseClient.example.ts supabaseClient.ts
```

Run the frontend:

```bash
npm run dev
```

Frontend will run at:

```
http://localhost:5173
```

---

## 📸 Screenshots

The following screenshots illustrate the system workflow and user interface:

- 🏠 **User Dashboard**
  ![Dashboard](./docs/screenshots/dashboard.png)

- 📝 **Loan Application Form**
  ![Application](./docs/screenshots/application.png)

- 📄 **Document Upload Interface**
  ![Upload](./docs/screenshots/upload.png)

- 🔍 **Extracted Financial Data**
  ![OCR](./docs/screenshots/ocr.png)

- 📊 **Credit Score Output**
  ![Score](./docs/screenshots/score.png)

- 🧠 **Explainability Insights**
  ![Explainability](./docs/screenshots/explainability.png)

---

## 👨‍💻 Contributors

- Hrishit Patil
- Sanket Nandurkar
- Ayush Nayak
- Om Nandurkar

---

## 📜 License

MIT License
