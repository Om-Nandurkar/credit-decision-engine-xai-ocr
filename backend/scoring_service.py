import os
import joblib
import pandas as pd
import numpy as np
import shap
import lime
import lime.lime_tabular
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder
from supabase import create_client, Client
from dotenv import load_dotenv
import traceback

# NEW IMPORT
from counterfactual_service import generate_counterfactuals

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

MODEL_FILENAME = "fynxai_credit_scoring_model.pkl"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, MODEL_FILENAME)
TRAIN_DATA_PATH = os.path.join(BASE_DIR, "credit_scoring_data_v2.csv")

model_pipeline = None
df_train = pd.DataFrame()

if os.path.exists(MODEL_PATH):
    try:
        model_pipeline = joblib.load(MODEL_PATH)
        print(f"[Scoring Service] ✅ Model loaded successfully from {MODEL_PATH}")
    except Exception as e:
        print(f"[Scoring Service] ❌ CRITICAL: Failed to load model. Error: {e}")
else:
    print(f"[Scoring Service] ❌ CRITICAL: .pkl file NOT FOUND at {MODEL_PATH}")

if os.path.exists(TRAIN_DATA_PATH):
    try:
        df_train = pd.read_csv(TRAIN_DATA_PATH)
        print(f"[Scoring Service] ✅ Training Data loaded for LIME from {TRAIN_DATA_PATH}")
    except Exception as e:
        print(f"[Scoring Service] ⚠️ Could not load training data for LIME: {e}")

def get_clean_string(val, default=""):
    if val is None: return default
    return str(val).strip()

def generate_human_explanation(score, status, shap_data):
    positives = [item for item in shap_data if item['impact'] > 0]
    negatives = [item for item in shap_data if item['impact'] < 0]

    narrative = f"The AI model calculated a Credit Score of {score}, resulting in a '{status.upper()}' recommendation. "

    if status == "approved":
        if positives:
            top_pos = [f"{p['feature']} (+{int(p['impact'])})" for p in positives]
            narrative += f"This decision was primarily driven by strong financial indicators, specifically: {', '.join(top_pos)}. "
        if negatives:
            top_neg = [f"{n['feature']} ({int(n['impact'])})" for n in negatives]
            narrative += f"However, the score was slightly held back by factors related to: {', '.join(top_neg)}."
        else:
            narrative += "The profile shows consistent financial health with no major red flags."
    else: 
        if negatives:
            top_neg = [f"{n['feature']} ({int(n['impact'])})" for n in negatives]
            narrative += f"The main reasons for this decision were significant risks identified in: {', '.join(top_neg)}. "
        if positives:
            top_pos = [f"{p['feature']} (+{int(p['impact'])})" for p in positives]
            narrative += f"Although there were positive signs in: {', '.join(top_pos)}, they were not sufficient to offset the identified risks."
        else:
            narrative += "Multiple risk factors contributed to this score, indicating potential repayment difficulties."

    return narrative

def calculate_credit_score(application_id):
    if not model_pipeline:
        print("[Scoring Service] ❌ Model not loaded. Cannot proceed.")
        return False

    print(f"\n[Scoring Service] 🤖 Starting Analysis for App ID: {application_id}")

    try:
        response = supabase.table('xai_data') \
            .select('model_json') \
            .eq('application_id', application_id) \
            .order('created_at', desc=True) \
            .limit(1) \
            .single() \
            .execute()
        
        if not response.data or not response.data['model_json']:
            print("[Scoring Service] ❌ No XAI data found.")
            return False

        raw = response.data['model_json']
        
        loan_res = supabase.table('loans').select('loan_amount, loan_tenure').eq('application_id', application_id).single().execute()
        loan_info = loan_res.data or {}
        req_amount = float(loan_info.get('loan_amount') or 0)
        req_tenure = int(loan_info.get('loan_tenure') or 12)
        
        income_profile = raw.get('income_profile', {})
        employment_profile = raw.get('employment_profile', {})
        liquidity_behavior = raw.get('liquidity_behavior', {})
        credit_exposure = raw.get('credit_exposure', {})
        behavioral_flags = raw.get('behavioral_risk_flags', {})

        active_loans_list = credit_exposure.get('active_loans', [])
        if isinstance(active_loans_list, str): active_loans_list = [active_loans_list] 
        
        has_credit_card = 1 if any("CREDIT_CARD" in str(x).upper() for x in active_loans_list) else 0
        has_personal_loan = 1 if any("PERSONAL" in str(x).upper() for x in active_loans_list) else 0
        has_home_loan = 1 if any("HOME" in str(x).upper() for x in active_loans_list) else 0
        active_loans_count = len(active_loans_list)

        features = {
            "income_stability": get_clean_string(income_profile.get('income_stability', "STABLE")),
            "average_eligible_emi": float(income_profile.get('average_eligible_emi') or 0),
            "average_usable_salary": float(income_profile.get('average_usable_salary') or 0),
            "average_monthly_credit": float(income_profile.get('average_monthly_credit') or 0) ,
            "employer_category": get_clean_string(employment_profile.get('employer_category', "Category A (MNC/Govt/PSU)")),
            "employment_tenure_years": float(employment_profile.get('employment_tenure_years') or 0),
            "average_month_end_balance": float(liquidity_behavior.get('average_month_end_balance') or 0),
            "bounce_count": int(behavioral_flags.get('bounce_count', 0)),
            "gambling_transaction_count": int(behavioral_flags.get('gambling_transaction_count', 0)),
            "active_loans_count": active_loans_count,
            "has_credit_card": has_credit_card,
            "has_personal_loan": has_personal_loan,
            "has_home_loan": has_home_loan,
            "credit_exposure_intensity": float(credit_exposure.get('credit_exposure_intensity') or 0),
            "average_obligation_to_income_ratio": float(credit_exposure.get('average_obligation_to_income_ratio') or 0)
        }

        training_cols = [
            'income_stability', 'average_eligible_emi', 'average_usable_salary', 
            'average_monthly_credit', 'employer_category', 'employment_tenure_years', 
            'average_month_end_balance', 'bounce_count', 'gambling_transaction_count', 
            'active_loans_count', 'has_credit_card', 'has_personal_loan', 'has_home_loan', 
            'credit_exposure_intensity', 'average_obligation_to_income_ratio'
        ]
        
        df = pd.DataFrame([features])
        df = df[training_cols]

        predicted_score = model_pipeline.predict(df)[0]
        final_score = int(round(predicted_score))
        status = "approved" if final_score >= 650 else "rejected"
        
        interest_rate = None
        sanctioned_amount = 0
        
        if status == "approved":
            if final_score >= 800: interest_rate = 9.5
            elif final_score >= 750: interest_rate = 12.5
            elif final_score >= 700: interest_rate = 17.0
            else: interest_rate = 24.0
            
            if req_amount > 0 and req_tenure > 0:
                avg_eligible_emi = float(income_profile.get('average_eligible_emi', 0))
                if avg_eligible_emi <= 0:
                    usable_salary = float(income_profile.get('average_usable_salary', 0))
                    avg_eligible_emi = usable_salary * 0.40 
                
                monthly_rate = (interest_rate / 100) / 12
                n_months = req_tenure
                
                factor = ((1 + monthly_rate) ** n_months) / (((1 + monthly_rate) ** n_months) - 1)
                req_emi = req_amount * monthly_rate * factor
                
                if req_emi <= avg_eligible_emi:
                    sanctioned_amount = req_amount
                else:
                    max_principal = avg_eligible_emi / (monthly_rate * factor)
                    sanctioned_amount = int(max_principal / 1000) * 1000
                    sanctioned_amount = min(sanctioned_amount, req_amount)

        print(f"[Scoring Service] 🎯 SCORE: {final_score} | RATE: {interest_rate}% | SANCTIONED: {sanctioned_amount}")

        # --- GENERATE COUNTERFACTUALS (NEW) ---
        counterfactual_paths = []
        if status == "rejected":
            counterfactual_paths = generate_counterfactuals(features, model_pipeline, training_cols)
        # --------------------------------------

        ui_names = {
            'income_stability': 'Income Stability',
            'average_eligible_emi': 'Average Eligible EMI',
            'average_usable_salary': 'Average Usable Salary',
            'average_monthly_credit': 'Average Monthly Credit',
            'employer_category': 'Employer Category',
            'employment_tenure_years': 'Employment Tenure (Years)',
            'average_month_end_balance': 'Avg Month End Balance',
            'bounce_count': 'Bounce Count',
            'gambling_transaction_count': 'Gambling Transactions',
            'active_loans_count': 'Total Active Loans',
            'has_credit_card': 'Active Credit Card Status',
            'has_personal_loan': 'Active Personal Loan Status',
            'has_home_loan': 'Active Home Loan Status',
            'credit_exposure_intensity': 'Credit Exposure Intensity',
            'average_obligation_to_income_ratio': 'Obligation to Income Ratio'
        }

        # --- 7. Explainability (SHAP) ---
        shap_output = []
        top_contributing_factor = "Analysis Pending"

        try:
            preprocessor = model_pipeline.named_steps['preprocessor']
            xgb_model = model_pipeline.named_steps['model']
            transformed_X = preprocessor.transform(df)
            feature_names = preprocessor.get_feature_names_out()

            explainer = shap.TreeExplainer(xgb_model)
            shap_values = explainer.shap_values(transformed_X)
            
            row_shap = shap_values[0] if len(shap_values.shape) > 1 else shap_values
            
            sorted_cols = sorted(training_cols, key=len, reverse=True)
            aggregated_shap = {col: 0.0 for col in training_cols}
            
            for name, val in zip(feature_names, row_shap):
                clean_name = name.split('__')[-1] 
                for col in sorted_cols:
                    if clean_name.startswith(col):
                        aggregated_shap[col] += float(val)
                        break

            for col, impact in aggregated_shap.items():
                shap_output.append({
                    "feature": ui_names.get(col, col.replace('_', ' ').title()),
                    "impact": float(impact)
                })

            shap_output.sort(key=lambda x: abs(x['impact']), reverse=True)
            if shap_output:
                top_contributing_factor = shap_output[0]["feature"]

        except Exception as s_err:
            print(f"[Scoring Service] ⚠️ SHAP Warning: {s_err}")
            shap_output = []

        # --- 8. Explainability (LIME) ---
        lime_output = []
        try:
            if not df_train.empty:
                categorical_features = ['income_stability', 'employer_category']
                categorical_idx = [training_cols.index(c) for c in categorical_features]
                
                encoders = {}
                X_train_lime = df_train[training_cols].copy()
                categorical_names = {}
                
                for col in categorical_features:
                    le = LabelEncoder()
                    X_train_lime[col] = le.fit_transform(X_train_lime[col].astype(str))
                    encoders[col] = le
                    idx = training_cols.index(col)
                    categorical_names[idx] = le.classes_
                    
                X_train_lime = X_train_lime.astype(float)
                
                X_test_lime = df.copy()
                for col in categorical_features:
                    known_classes = set(encoders[col].classes_)
                    X_test_lime[col] = X_test_lime[col].apply(lambda x: x if x in known_classes else encoders[col].classes_[0])
                    X_test_lime[col] = encoders[col].transform(X_test_lime[col].astype(str))
                X_test_lime = X_test_lime.astype(float)

                explainer_lime = lime.lime_tabular.LimeTabularExplainer(
                    X_train_lime.values,
                    feature_names=training_cols,
                    categorical_features=categorical_idx,
                    categorical_names=categorical_names,
                    mode='regression',
                    random_state=42
                )
                
                def predict_fn_lime(x_numeric_array):
                    df_fake = pd.DataFrame(x_numeric_array, columns=training_cols)
                    for col in categorical_features:
                        df_fake[col] = df_fake[col].astype(int)
                        df_fake[col] = df_fake[col].clip(0, len(encoders[col].classes_) - 1)
                        df_fake[col] = encoders[col].inverse_transform(df_fake[col])
                    
                    return model_pipeline.predict(df_fake)
                    
                exp = explainer_lime.explain_instance(
                    X_test_lime.values[0],
                    predict_fn_lime,
                    num_features=len(training_cols)
                )
                
                lime_map_dict = exp.as_map()
                first_key = list(lime_map_dict.keys())[0]
                lime_map = dict(lime_map_dict[first_key])
                
                for idx, weight in lime_map.items():
                    col_name = training_cols[idx]
                    lime_output.append({
                        "feature": ui_names.get(col_name, col_name.replace('_', ' ').title()),
                        "impact": float(weight)
                    })
                
                shap_direction_map = {item['feature']: (1 if item['impact'] >= 0 else -1) for item in shap_output}
                
                for item in lime_output:
                    feat = item['feature']
                    if feat in shap_direction_map:
                        item['impact'] = abs(item['impact']) * shap_direction_map[feat]

                lime_output.sort(key=lambda x: abs(x['impact']), reverse=True)
            else:
                print("[Scoring Service] ⚠️ LIME Skipped: df_train is empty. CSV file not found.")
        except Exception as lime_err:
            print(f"[Scoring Service] ⚠️ LIME Error: {lime_err}")
            traceback.print_exc()
            lime_output = []

        explanation_text = generate_human_explanation(final_score, status, shap_output)

        # 9. Update Database (NEW: Pushing Counterfactuals)
        supabase.table('loans').update({
            "credit_score": final_score,
            "loan_status": status,
            "sanctioned_amount": sanctioned_amount,
            "interest_rate": interest_rate
        }).eq('application_id', application_id).execute()
        
        supabase.table('xai_data').update({
            "shap_values": shap_output,
            "lime_values": lime_output, 
            "counterfactuals": counterfactual_paths, 
            "explanation_output": explanation_text,
            "top_contributing_factor": top_contributing_factor
        }).eq('application_id', application_id).execute()

        print("[Scoring Service] ✅ Process Complete.")
        return True

    except Exception as e:
        print(f"[Scoring Service] ❌ Process Error: {e}")
        traceback.print_exc()
        return False