# FairScan — Complete Project Brief
### Unbiased AI Decision-Making Platform
> **This document is a self-contained project specification. No additional context is needed to understand, build, or extend this project.**

---

## Table of Contents
1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Target Users](#3-target-users)
4. [System Architecture](#4-system-architecture)
5. [User Flow](#5-user-flow)
6. [Feature Specification](#6-feature-specification)
7. [Future Roadmap](#7-future-roadmap)
8. [Tech Stack](#8-tech-stack)
9. [Key Concepts & Glossary](#9-key-concepts--glossary)
10. [Regulatory Context](#10-regulatory-context)

---

## 1. Problem Statement

### Background
Computer programs now make life-changing decisions — who gets a job, who receives a bank loan, who qualifies for medical care, who gets bail, and more. These automated systems are trained on historical data. If that historical data reflects past discrimination or societal inequalities, the model will learn those patterns and **repeat and amplify** the same discriminatory outcomes at scale, often invisibly.

### The Core Issue
- **Hidden bias in data**: Datasets carry historical discrimination embedded in features like income, zip code, or job title — even without explicitly including protected attributes like race or gender.
- **Proxy discrimination**: Even when sensitive attributes (e.g., race) are removed from a dataset, the model can still discriminate via correlated proxies — e.g., zip code as a proxy for race, first name as a proxy for gender.
- **No visibility for organisations**: Most organisations deploying ML models have no tools to measure, detect, or prove fairness. They are legally exposed without knowing it.
- **Non-technical stakeholders are excluded**: Fairness reports produced by data scientists are too technical for legal, compliance, or policy teams to act on.

### Objective
Build **FairScan** — a clear, accessible platform that allows organisations to thoroughly inspect their datasets and ML models for hidden bias and discrimination. Provide an easy way to measure, flag, explain, and fix harmful bias **before** systems impact real people, and continuously monitor deployed models for fairness drift over time.

---

## 2. Solution Overview

**FairScan** is a web-based AI fairness auditing platform built on Google Cloud (Vertex AI + Gemini). It offers:

- **End-to-end bias detection**: From raw dataset upload to deployed model monitoring.
- **Plain-language explainability**: Converts technical fairness metrics into summaries readable by non-technical stakeholders (legal, compliance, policy teams).
- **Actionable mitigation**: One-click debiasing suggestions with before/after fairness comparisons.
- **Regulatory compliance mapping**: Maps detected issues to GDPR, EU AI Act, and US EEOC guidelines.
- **Continuous monitoring**: Alerts teams the moment a deployed model starts exhibiting fairness drift.

### Product Name
**FairScan**

### Core Tagline
*"Inspect. Explain. Fix. Monitor."*

---

## 3. Target Users

| User Type | Role | Primary Need |
|-----------|------|--------------|
| Data Scientist / ML Engineer | Builds and trains ML models | Detect and fix bias before deployment |
| Compliance / Legal Officer | Ensures regulatory compliance | Understand risk exposure and generate audit trails |
| Product Manager | Owns the AI product | Confidence that the product is fair and defensible |
| Policy Maker / Regulator | Reviews AI systems for public accountability | Standardised fairness reports and model cards |
| Affected Individuals (future) | Subject to automated decisions | Explanation of decisions made about them |

---

## 4. System Architecture

The FairScan architecture is structured into **5 sequential layers**, each feeding into the next:

```
┌─────────────────────────────────────────────────┐
│                  INPUT LAYER                    │
│  Dataset Upload    Model Upload    Vertex AI    │
│  (CSV, Sheets,     (ONNX, TF,     Connector     │
│   JSON)            sklearn)       (Pull deployed │
│                                   models)        │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│               AI ANALYSIS LAYER                 │
│  Gemini API       Vertex Explainable AI   Vertex│
│  (Proxy + NLP      (SHAP Attribution)    Eval.  │
│   scan)                                 (Slice- │
│                                          based  │
│                                         metrics)│
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│          MITIGATION & REPORTING LAYER           │
│  Vertex AI Pipelines   Gemini Report Gen  Gemini│
│  (Debiasing +        (PDF + Model Card)   Ground│
│   Retraining)                            (Reg.  │
│                                           Map)  │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│           MONITORING & DATA LAYER               │
│  Vertex Monitor    MongoDB              BigQuery│
│  (Live fairness    (Audit history +     + Looker│
│   drift alerts)    metadata)           (Trends +│
│                                         bench.) │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│                  WEB DASHBOARD                  │
│        Scores · Explainers · Reports · Fixes    │
└─────────────────────────────────────────────────┘
```

### Layer Breakdown

#### Layer 1 — Input Layer
Accepts inputs from three sources:
- **Dataset Upload**: CSV, Google Sheets, JSON files. Auto-detects schema, data types, and sensitive attributes.
- **Model Upload**: Pre-trained models in ONNX, TensorFlow, or scikit-learn format.
- **Vertex AI Connector**: Pulls already-deployed models directly from Google Vertex AI.

#### Layer 2 — AI Analysis Layer
Runs three parallel analyses:
- **Gemini API**: NLP-based scan to identify protected attribute columns and their proxies (e.g., zip code → race, name → gender).
- **Vertex Explainable AI**: Computes SHAP (Shapley) values to show which features drive predictions and whether those features correlate with sensitive attributes.
- **Vertex Model Evaluation**: Computes slice-based fairness metrics — accuracy, false positive rate (FPR), false negative rate (FNR) — broken down by gender, age group, ethnicity, and intersectional combinations.

#### Layer 3 — Mitigation & Reporting Layer
Three outputs generated simultaneously:
- **Vertex AI Pipelines**: Applies pre-processing debiasing fixes (resampling, reweighting, proxy feature removal) and optionally retrains the model with fairness constraints.
- **Gemini Report Generation**: Auto-generates a structured PDF bias audit report with findings, severity scores, and plain-language explanations. Also generates a standardised model card.
- **Gemini Grounded Search**: Maps detected bias issues to specific regulations (GDPR Article 22, EU AI Act, US EEOC) with compliance risk ratings.

#### Layer 4 — Monitoring & Data Layer
Handles persistence and ongoing oversight:
- **Vertex AI Model Monitor**: Continuously monitors deployed models for fairness drift and sends alerts when any demographic slice's performance degrades below threshold.
- **MongoDB**: Stores all audit history, model metadata, and user-configured thresholds.
- **BigQuery + Looker**: Aggregates cross-audit trends and enables benchmarking across industry peers (future).

#### Layer 5 — Web Dashboard
The main user interface. Displays:
- Fairness scores and visualisations per demographic slice
- SHAP-based feature attribution charts
- Plain-English bias summaries
- Mitigation options with before/after previews
- Downloadable reports and model cards
- Compliance risk indicators mapped to regulations

---

## 5. User Flow

The following is the complete step-by-step user journey through FairScan:

```
[START] User lands on FairScan
            │
            ▼
┌─────────────────────────────────┐
│         UPLOAD SCREEN           │
│  User uploads one of:           │
│  • Dataset (CSV / Sheets / JSON)│
│  • ML model (ONNX / TF /sklearn)│
│  • Vertex AI deployed model link│
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│       AUTO-DETECT CONFIG        │
│  FairScan automatically:        │
│  • Detects schema and data types│
│  • Flags sensitive/protected    │
│    attributes and their proxies │
│  • Identifies the use case      │
│    (lending, hiring, healthcare)│
│  User can review and confirm    │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│       AI ANALYSIS RUNNING       │
│  Gemini + Vertex AI fairness    │
│  scan executes in background.   │
│  Shows progress indicator.      │
└────────────────┬────────────────┘
                 │
                 ▼
          ┌──────────────┐
          │  BIAS FOUND? │
          └──┬───────┬───┘
          Yes│       │No
             │       │
             │       ▼
             │  ┌─────────────────┐
             │  │   NO BIAS       │
             │  │  Clean bill of  │
             │  │  health screen. │
             │  │  Option to      │
             │  │  enable live    │
             │  │  monitoring and │
             │  │  export model   │
             │  │  card anyway.   │
             │  └────────┬────────┘
             │           │ (loops back to monitoring)
             ▼           │
┌─────────────────────────────────┐
│      BIAS REPORT DASHBOARD      │
│  Displays:                      │
│  • Fairness scores by metric    │
│    (demographic parity, equal   │
│    opportunity, predictive      │
│    parity, disparate impact)    │
│  • Slice-based breakdown        │
│    (gender, age, ethnicity,     │
│    intersectional slices)       │
│  • SHAP feature attribution     │
│    chart — which features drove │
│    biased predictions           │
│  • Plain-English Gemini summary │
│    readable by non-technical    │
│    stakeholders                 │
│  • Severity scores per finding  │
└────────────────┬────────────────┘
                 │
                 ▼
     ┌───────────────────────┐
     │ VIEW PER-DECISION     │
     │    EXPLAINER?         │
     └─────┬─────────┬───────┘
         Yes│         │No / Done
            ▼         │
  ┌──────────────────┐│
  │  DECISION        ││
  │  EXPLAINER       ││
  │  Screen shows    ││
  │  human-readable  ││
  │  explanation for ││
  │  any individual  ││
  │  prediction:     ││
  │  "Why was this   ││
  │  loan denied?"   ││
  └────────┬─────────┘│
           │ (returns) │
           └────┬──────┘
                │
                ▼
┌─────────────────────────────────┐
│        MITIGATION SCREEN        │
│  User selects a debiasing fix:  │
│  • Resampling (balance classes) │
│  • Reweighting (sample weights) │
│  • Proxy removal (remove        │
│    correlated surrogate cols)   │
│  • Threshold adjustment         │
│    (per demographic group)      │
│  Shows before/after fairness    │
│  preview before committing.     │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│      APPLY FIX + RETRAIN        │
│  Vertex AI Pipelines retrains   │
│  the model with fairness        │
│  constraints applied.           │
│  Shows accuracy vs fairness     │
│  trade-off comparison.          │
│  User approves and commits.     │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   EXPORT REPORT + MODEL CARD   │
│  Auto-generated outputs:        │
│  • PDF bias audit report with   │
│    findings, severity scores,   │
│    and recommendations          │
│  • Regulatory compliance map    │
│    (GDPR / EU AI Act / EEOC)   │
│  • Standardised model card      │
│    (fairness metrics, intended  │
│    use, known limitations)      │
│  • Shareable with legal /       │
│    compliance / policymakers    │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│      ENABLE LIVE MONITORING     │
│  Vertex AI Model Monitor        │
│  continuously tracks deployed   │
│  model for fairness drift.      │
│  Alerts sent when any slice     │
│  performance falls below        │
│  configured thresholds.         │
└─────────────────────────────────┘
                [END]
```

---

## 6. Feature Specification

### 6.1 — Dataset Auditing

#### Multi-format Dataset Upload
- Accept CSV, JSON, SQL exports, and Google Sheets links.
- Auto-detect schema, column data types, and protected attributes such as gender, race, and age.
- Preview ingested data before analysis begins.
- **Tech**: Gemini API + Vertex AI Tabular

#### Protected Attribute Scanner
- Automatically flag sensitive columns (explicit: gender, race, age, religion).
- Detect **proxy attributes** — columns that correlate with sensitive attributes:
  - Zip code → likely proxy for race or socioeconomic status
  - First name → likely proxy for gender or ethnicity
  - Job title → likely proxy for gender
- Flag proxy columns with confidence scores and explanations.
- **Tech**: Gemini NLP API

#### Statistical Disparity Report
- Measure class imbalance across the target variable (e.g., 90% loan approvals for group A, 40% for group B).
- Quantify representation gaps — are minority groups underrepresented in training data?
- Compute feature correlation matrix between all columns and protected attributes.
- **Tech**: Vertex AI Tabular

---

### 6.2 — Model Bias Detection

#### Multi-metric Fairness Scoring
Compute all standard fairness metrics across all demographic slices:
- **Demographic Parity**: Are positive outcomes distributed equally across groups?
- **Equal Opportunity**: Are true positive rates equal across groups?
- **Predictive Parity**: Are precision rates equal across groups?
- **Disparate Impact**: Is the ratio of positive outcomes ≥ 0.8 (80% rule) across groups?
- **Tech**: Vertex AI Explainability

#### Feature Attribution Analysis
- Use **SHAP (Shapley Additive Explanations)** values to show which input features drive each prediction.
- Expose hidden reliance on sensitive or proxy attributes even in "fairness-aware" models.
- Visualise feature importance charts per demographic group.
- **Tech**: Vertex Explainable AI

#### Slice-based Performance Audit
- Evaluate model performance metrics broken down by:
  - Gender (male / female / non-binary)
  - Age groups (e.g., 18–25, 26–40, 41–60, 60+)
  - Ethnicity / race
  - Intersectional combinations (e.g., Black women, elderly Latino men)
- Metrics computed per slice: accuracy, false positive rate (FPR), false negative rate (FNR), precision, recall.
- **Tech**: Vertex Model Evaluation

---

### 6.3 — Bias Explanation in Plain Language

#### Plain-language Bias Summary
- Gemini converts raw fairness metric outputs into plain-English paragraphs.
- Readable by non-technical stakeholders: legal officers, compliance teams, policymakers, executives.
- Example output: *"The model is 2.3x more likely to deny loans to applicants from zip codes associated with predominantly Black neighbourhoods, even when controlling for credit score and income."*
- **Tech**: Gemini Pro API

#### Per-decision Explainer
- For any individual prediction (a specific loan denial, job rejection, or medical triage decision), generate a human-readable explanation:
  - "This loan was denied primarily because of your zip code (high correlation with income bracket) and employment gap."
- Supports affected individual transparency and appeals processes.
- **Tech**: Gemini + SHAP

#### Audit Trail & PDF Report
- Auto-generate a structured bias audit report containing:
  - Executive summary (plain language)
  - Methodology section
  - Full fairness metric findings with visualisations
  - Severity rating for each finding (Low / Medium / High / Critical)
  - Specific recommendations for remediation
- Shareable with legal and compliance teams.
- **Tech**: Gemini Document Generation

---

### 6.4 — Bias Mitigation Toolkit

#### One-click Debiasing Suggestions
- Recommend and apply pre-processing fixes:
  - **Resampling**: Oversample underrepresented groups or undersample overrepresented ones.
  - **Reweighting**: Assign higher sample weights to disadvantaged group examples during training.
  - **Proxy removal**: Identify and remove or transform proxy columns that encode sensitive attributes.
- Show before/after fairness scores instantly after applying each fix.
- **Tech**: Vertex AI Pipelines

#### Fairness-aware Retraining
- Re-train the model using fairness constraints (e.g., enforce demographic parity during optimisation).
- Show side-by-side comparison of accuracy vs. fairness trade-offs before the user commits.
- User approves the trade-off before retraining is finalised.
- **Tech**: Vertex AI Training

#### Threshold Optimiser
- Interactively adjust decision thresholds per demographic group (e.g., lower the threshold for approving loans for Group A to equalise FPR across groups).
- Show real-time impact on all fairness metrics and overall accuracy as the slider moves.
- **Tech**: Vertex AI + Gemini

---

### 6.5 — Monitoring & Compliance

#### Live Model Monitoring
- Continuously monitor deployed models for **fairness drift** over time.
- Alert the team the moment performance for any demographic slice degrades below a configured threshold.
- Dashboard view showing fairness trends over time.
- **Tech**: Vertex AI Model Monitor

#### Regulatory Compliance Mapping
- Map detected bias issues directly to relevant laws and regulations:
  - **GDPR Article 22**: Right not to be subject to solely automated decisions
  - **EU AI Act**: High-risk AI system requirements for fairness and transparency
  - **US EEOC Guidelines**: Equal employment opportunity requirements for AI hiring tools
- Provide compliance risk rating (Low / Medium / High) per regulation.
- **Tech**: Gemini Grounded Search

#### Model Card Generator
- Auto-generate a standardised **Model Card** documenting:
  - Intended use and deployment context
  - Known limitations and failure modes
  - Fairness metrics and their values
  - Evaluation methodology
  - Contact and accountability information
- Ready for public disclosure or regulatory submission.
- **Tech**: Gemini Pro API


## 7. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React.js | Web dashboard UI |
| **Backend** | Node.js | API server, orchestration |
| **AI — NLP & Explanations** | Gemini Pro API | Plain-language summaries, proxy detection, report generation |
| **AI — Fairness Metrics** | Vertex AI Model Evaluation | Slice-based metric computation |
| **AI — Explainability** | Vertex Explainable AI (SHAP) | Feature attribution |
| **AI — Mitigation** | Vertex AI Pipelines + Training | Debiasing and fairness-aware retraining |
| **AI — Monitoring** | Vertex AI Model Monitor | Live fairness drift detection |
| **AI — Compliance** | Gemini Grounded Search | Regulatory mapping |
| **Database** | MongoDB | Audit history, model metadata, user settings |
| **Analytics** | BigQuery + Looker | Trend analysis, benchmarking |
| **Auth** | Custom Authentication in MERN stack | User authentication and team management |
| **File Handling** | Google Cloud Storage / S3 bucket | Dataset and model file storage |
| **Model Formats** | ONNX, TensorFlow, scikit-learn | Supported model upload formats |
| **Dataset Formats** | CSV, JSON, SQL export, Google Sheets | Supported dataset input formats |

---

## 8. Key Concepts & Glossary

| Term | Definition |
|------|-----------|
| **Algorithmic Bias** | Systematic and unfair discrimination produced by an ML model against certain individuals or groups. |
| **Protected Attribute** | A characteristic legally protected from discrimination: race, gender, age, religion, national origin, disability. |
| **Proxy Attribute** | A feature in the dataset that is not itself a protected attribute but is correlated with one (e.g., zip code for race). |
| **Demographic Parity** | A fairness criterion requiring that the proportion of positive outcomes is equal across demographic groups. |
| **Equal Opportunity** | A fairness criterion requiring equal true positive rates (TPR) across groups — i.e., equally likely to correctly identify qualified candidates across groups. |
| **Predictive Parity** | A fairness criterion requiring equal precision across groups — i.e., when the model says "yes", it's equally often correct across groups. |
| **Disparate Impact** | The 80% rule: the ratio of positive outcome rates between the least and most advantaged group must be ≥ 0.8. A legal standard in US employment law. |
| **False Positive Rate (FPR)** | Rate at which the model incorrectly predicts a positive outcome for a negative case. Disparities in FPR across groups indicate different error costs. |
| **False Negative Rate (FNR)** | Rate at which the model misses a true positive. Higher FNR for a group means the model systematically under-serves that group. |
| **SHAP Values** | Shapley Additive Explanations — a game-theory-based method for computing each feature's individual contribution to a model's prediction. |
| **Fairness Drift** | A degradation in a deployed model's fairness over time, often caused by shifts in the distribution of incoming data. |
| **Model Card** | A standardised documentation artifact describing an ML model's intended use, performance metrics, fairness evaluation, and known limitations. |
| **Intersectional Analysis** | Evaluating bias not just for single groups (e.g., women) but for overlapping group combinations (e.g., Black women over 50). |
| **Slice-based Evaluation** | Measuring model performance separately for different subgroups rather than averaging performance across the full population. |
| **Pre-processing Mitigation** | Fixing bias in the training data before model training (resampling, reweighting, proxy removal). |
| **In-processing Mitigation** | Fixing bias during model training by adding fairness constraints to the loss function. |
| **Post-processing Mitigation** | Fixing bias by adjusting decision thresholds after the model has already been trained. |

---

## 9. Regulatory Context

FairScan maps detected bias to the following regulations:

### GDPR Article 22 (EU)
*Right not to be subject to solely automated decisions*
- Individuals have the right not to be subject to decisions based solely on automated processing that produce significant effects.
- Organisations must be able to explain automated decisions on request.
- FairScan provides the per-decision explainer and audit trail required to comply.

### EU AI Act
- Classifies AI systems used in hiring, credit scoring, education, healthcare, and law enforcement as **high-risk**.
- High-risk AI systems must undergo conformity assessments for bias and fairness.
- FairScan's audit reports and model cards are structured to satisfy EU AI Act documentation requirements.

### US Equal Employment Opportunity Commission (EEOC)
- Governs AI-powered hiring tools.
- Applies the **80% (disparate impact) rule**: selection rates for any protected group must be at least 80% of the rate of the most favoured group.
- FairScan computes disparate impact scores and flags violations automatically.

### Additional Applicable Standards
- **ISO/IEC 42001** (AI Management System Standard)
- **NIST AI RMF** (Risk Management Framework — USA)
- **India's Draft Digital Personal Data Protection Act** (for Indian deployments)
- **UK Equality Act 2010** (indirect discrimination provisions)

