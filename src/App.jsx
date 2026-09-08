import React, { useMemo, useState } from "react";
import {
  ArrowRight, ArrowLeft, Check, ChevronDown, Download, ShieldCheck,
  Sparkles, RotateCcw, Info, AlertTriangle, CircleCheck, CircleX,
  WalletCards, Gauge, Percent, SlidersHorizontal
} from "lucide-react";
import { calculate, formatINR, PERSONAS } from "./rules";

const initial = {
  name: "",
  age: "",
  city: "",
  incomeType: "",
  product: "",
  purpose: "",
  amount: "",
  income: "",
  itrIncome: "",
  expenses: "",
  creditScore: "",
  bounces: 0,
  incomeStability: "",
  collateralValue: "",
  tenure: 5,
  householdOtherIncome: "",
  otherIncomeStability: "",
  existingLoans: [],
  existingEmi: "",
  existingDebtRate: "",
  emergencySavingsMonths: "",
  cardUtilisation: "",
  borrowingType: "",
  expectedMonthlyProfit: "",
  variableIncomeShare: "",
  upcomingExpenses: "",
};

function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Select({ value, onChange, children }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      {children}
    </select>
  );
}

function Progress({ step, total }) {
  return (
    <div className="progress">
      <div style={{ width: `${(step / total) * 100}%` }} />
    </div>
  );
}

function Why({ children }) {
  return (
    <details className="why">
      <summary>
        <Info size={15} /> Why this number?
      </summary>
      <p>{children}</p>
    </details>
  );
}

function Metric({ icon: Icon, label, value, sub, tone = "" }) {
  return (
    <div className={`metric ${tone}`}>
      <div className="metric-icon">
        <Icon size={18} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home");
  const [answers, setAnswers] = useState(initial);
  const [step, setStep] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const result = useMemo(
    () => screen === "results" ? calculate(answers) : null,
    [screen, answers]
  );

  const set = (key, val) =>
    setAnswers(a => ({ ...a, [key]: val }));

  function start(preset) {
    const data = preset ? { ...PERSONAS[preset] } : { ...initial };
    setAnswers(data);
    setStep(1);
    setScreen("assessment");
    setShowAll(false);
  }

  function next() {
    if (step < 7) {
      setStep(s => s + 1);
    } else {
      setScreen("results");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    if (step > 1) {
      setStep(s => s - 1);
    } else {
      setScreen("home");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (screen === "home") {
    return <Home onStart={start} />;
  }

  if (screen === "assessment") {
    return (
      <Assessment
        answers={answers}
        set={set}
        step={step}
        next={next}
        back={back}
      />
    );
  }

  return (
    <Results
      answers={answers}
      result={result}
      onRestart={() => start()}
      showAll={showAll}
      setShowAll={setShowAll}
    />
  );
}

function Home({ onStart }) {
  return (
    <div className="app">
      <nav>
        <div className="brand">
          <span className="brand-mark">L</span> lokta <em>borrower copilot</em>
        </div>

        <span className="nav-pill">
          <ShieldCheck size={14} /> No login · no data stored
        </span>
      </nav>

      <main className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <Sparkles size={15} /> Borrowing, decoded
          </div>

          <h1>
            Know your number<br />
            <i>before</i> the lender does.
          </h1>

          <p className="hero-text">
            A transparent self-assessment that tells you whether to borrow,
            how much you can safely carry, what rate is fair, and the EMI
            you should agree to.
          </p>

          <div className="hero-actions">
            <button className="primary" onClick={() => onStart()}>
              Start assessment <ArrowRight size={18} />
            </button>
            <span>~3 minutes · 7 steps</span>
          </div>

          <div className="trust-row">
            <span><Check size={15} /> Indian rupees</span>
            <span><Check size={15} /> Explainable rules</span>
            <span><Check size={15} /> Ranges, not fake precision</span>
          </div>
        </div>

        <div className="hero-card">
          <div className="card-top">
            <span>YOUR BORROWING CARD</span>
            <span className="live-dot">● ready</span>
          </div>

          <div className="fake-verdict">
            <div>
              <small>VERDICT</small>
              <strong>Borrow less</strong>
            </div>
            <span>↘</span>
          </div>

          <div className="fake-grid">
            <div>
              <small>SAFE AMOUNT</small>
              <b>₹5.8L</b>
            </div>
            <div>
              <small>FAIR RATE</small>
              <b>11–12.5%</b>
            </div>
            <div>
              <small>SAFE EMI</small>
              <b>₹22K/mo</b>
            </div>
            <div>
              <small>CONFIDENCE</small>
              <b>Medium</b>
            </div>
          </div>

          <div className="fake-note">
            Your lender's sanction and your safe number are not always the same.
          </div>
        </div>
      </main>

      <section className="demo-section">
        <div>
          <div className="eyebrow">Try the challenge personas</div>
          <h2>See how the copilot thinks.</h2>
        </div>

        <div className="persona-row">
          <button onClick={() => onStart("priya")}>
            <b>Priya, 29</b>
            <span>Bengaluru · salaried</span>
            <small>₹8L wedding loan</small>
            <ArrowRight size={16} />
          </button>

          <button onClick={() => onStart("ravi")}>
            <b>Ravi, 42</b>
            <span>Mysuru · self-employed</span>
            <small>₹15L business expansion</small>
            <ArrowRight size={16} />
          </button>

          <button onClick={() => onStart("anita")}>
            <b>Anita, 35</b>
            <span>Hubballi · informal</span>
            <small>₹1.5L electric scooter</small>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <footer>
        Built for the Lokta Borrower Copilot Build Challenge · v1.0 · 7 Sep 2026
      </footer>
    </div>
  );
}

function Assessment({ answers, set, step, next, back }) {
  const validationMessage = (() => {
    if (step === 1 && !answers.product) {
      return "Choose a loan type to continue.";
    }

    if (step === 2) {
      if (!(Number(answers.amount) > 0)) {
        return "Enter the amount you want to borrow.";
      }

      const tenure = Number(answers.tenure);

      if (!(tenure >= 1)) {
        return "Enter a tenure of at least 1 year.";
      }

      if (tenure > 30) {
        return "This prototype allows a maximum tenure of 30 years.";
      }
    }

    if (step === 3) {
      if (!(Number(answers.income) > 0)) {
        return "Enter your net monthly income.";
      }

      if (
        answers.expenses === "" ||
        Number(answers.expenses) < 0
      ) {
        return "Enter your monthly household expenses.";
      }

      if (!answers.incomeType) {
        return "Choose your income type.";
      }
    }

    if (step === 4) {
      if (
        answers.existingLoans?.some(
          l => Number(l.emi) < 0 || Number(l.monthsLeft) < 0
        )
      ) {
        return "Existing EMI amounts and remaining months cannot be negative.";
      }

      if (
        answers.emergencySavingsMonths === "" ||
        Number(answers.emergencySavingsMonths) < 0
      ) {
        return "Enter your emergency savings in months (use 0 if none).";
      }
    }

    if (step === 5) {
      if (
        answers.creditScore !== "" &&
        (
          Number(answers.creditScore) < 300 ||
          Number(answers.creditScore) > 900
        )
      ) {
        return "Credit score must be between 300 and 900.";
      }

      if (
        answers.cardUtilisation !== "" &&
        (
          Number(answers.cardUtilisation) < 0 ||
          Number(answers.cardUtilisation) > 100
        )
      ) {
        return "Card utilisation must be between 0% and 100%.";
      }
    }

    if (step === 6) {
      if (!answers.incomeStability) {
        return "Choose how stable your income is.";
      }

      if (!answers.borrowingType) {
        return "Choose whether the borrowing is for consumption or to generate income.";
      }

      if (
        answers.borrowingType === "productive" &&
        !(Number(answers.expectedMonthlyProfit) >= 0)
      ) {
        return "Enter the expected additional monthly profit/income.";
      }
    }

    return "";
  })();

  const valid = !validationMessage;

  function handleNext() {
    if (!valid) return;
    next();
  }

  return (
    <div className="app narrow">
      <nav>
        <button className="back-nav" onClick={back}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className="brand">
          <span className="brand-mark">L</span> borrower copilot
        </div>

        <span className="step-label">Step {step} of 7</span>
      </nav>

      <Progress step={step} total={7} />

      <main className="question-wrap">

        {step === 1 && (
          <Step
            title="What are you borrowing for?"
            desc="This decides which product assumptions and rate band we use."
          >
            <div className="choice-grid">
              {[
                ["personal", "Personal / wedding"],
                ["business", "Business / working capital"],
                ["lap", "Against property"],
                ["vehicle", "Vehicle"],
                ["home", "Home"],
                ["other", "Other"]
              ].map(([v, l]) => (
                <Choice
                  key={v}
                  active={answers.product === v}
                  onClick={() => set("product", v)}
                >
                  {l}
                </Choice>
              ))}
            </div>

            <Field label="In one line, what will the money do for you?">
              <input
                value={answers.purpose}
                onChange={e => set("purpose", e.target.value)}
                placeholder="e.g. wedding, inventory, scooter for deliveries"
              />
            </Field>
          </Step>
        )}

        {step === 2 && (
          <Step
            title="How much do you want to borrow?"
            desc="Tell us the amount and tenure you would actually ask the lender for."
          >
            <Field label="Amount wanted">
              <div className="input-prefix">
                <span>₹</span>
                <input
                  type="number"
                  min="1"
                  value={answers.amount}
                  onChange={e => set("amount", e.target.value)}
                  placeholder="8,00,000"
                />
              </div>
            </Field>

            <Field
              label="Preferred tenure (years)"
              hint="Enter the tenure you are considering. The prototype evaluates tenures from 1 to 30 years. This is an input boundary, not a lender policy."
            >
              <div className="input-suffix">
                <input
                  type="number"
                  min="1"
                  max="30"
                  step="1"
                  value={answers.tenure}
                  onChange={e => set("tenure", e.target.value)}
                  placeholder="e.g. 6"
                />
                <span>years</span>
              </div>
            </Field>
          </Step>
        )}

        {step === 3 && (
          <Step
            title="What comes in and goes out each month?"
            desc="Use a normal month, not your best month."
          >
            <div className="two-col">
              <Field label="Your net monthly income">
                <div className="input-prefix">
                  <span>₹</span>
                  <input
                    type="number"
                    value={answers.income}
                    onChange={e => set("income", e.target.value)}
                    placeholder="1,10,000"
                  />
                </div>
              </Field>

              <Field label="Household expenses">
                <div className="input-prefix">
                  <span>₹</span>
                  <input
                    type="number"
                    value={answers.expenses}
                    onChange={e => set("expenses", e.target.value)}
                    placeholder="35,000"
                  />
                </div>
              </Field>
            </div>

            <Field
              label="Regular income from other household members (optional)"
              hint="Count only income that is regular and reliably available for household expenses/repayment. It supports safe cash-flow analysis, not lender-style income eligibility."
            >
              <div className="input-prefix">
                <span>₹</span>
                <input
                  type="number"
                  min="0"
                  value={answers.householdOtherIncome}
                  onChange={e => set("householdOtherIncome", e.target.value)}
                  placeholder="18,000"
                />
              </div>
            </Field>

            <Field label="Income type">
              <Select
                value={answers.incomeType}
                onChange={v => set("incomeType", v)}
              >
                <option value="">Choose one</option>
                <option value="salaried">Salaried</option>
                <option value="selfEmployed">
                  Self-employed / business
                </option>
                <option value="informal">
                  Informal / variable
                </option>
              </Select>
            </Field>

            {answers.incomeType === "selfEmployed" && (
              <Field
                label="Monthly income shown by ITR (if different)"
                hint="Leave blank if you don't know."
              >
                <div className="input-prefix">
                  <span>₹</span>
                  <input
                    type="number"
                    value={answers.itrIncome || ""}
                    onChange={e => set("itrIncome", e.target.value)}
                    placeholder="35,000"
                  />
                </div>
              </Field>
            )}
          </Step>
        )}

        {step === 4 && (
          <Step
            title="What debt and buffers do you have today?"
            desc="Tell us each active loan and when its EMI ends. Future EMI relief is shown separately; we don't pretend today's burden disappears today."
          >
            <Field label="How many active loans / EMIs do you have?">
              <Select
                value={answers.existingLoans?.length ?? 0}
                onChange={v => {
                  const n = Number(v);
                  const old = answers.existingLoans || [];

                  const nextLoans = Array.from(
                    { length: n },
                    (_, i) =>
                      old[i] || {
                        type: `Loan ${i + 1}`,
                        emi: "",
                        monthsLeft: "",
                        rate: ""
                      }
                  );

                  set("existingLoans", nextLoans);

                  set(
                    "existingEmi",
                    nextLoans.reduce(
                      (sum, l) => sum + Number(l.emi || 0),
                      0
                    )
                  );
                }}
              >
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>
                    {n === 0 ? "None" : n}
                  </option>
                ))}
              </Select>
            </Field>

            {(answers.existingLoans || []).map((loan, i) => (
              <div className="loan-card" key={i}>
                <b>Loan {i + 1}</b>

                <div className="two-col">
                  <Field label="Loan type">
                    <input
                      value={loan.type || ""}
                      onChange={e => {
                        const arr = [...(answers.existingLoans || [])];
                        arr[i] = {
                          ...arr[i],
                          type: e.target.value
                        };
                        set("existingLoans", arr);
                      }}
                      placeholder="Car / personal / app loan"
                    />
                  </Field>

                  <Field label="Monthly EMI">
                    <div className="input-prefix">
                      <span>₹</span>
                      <input
                        type="number"
                        min="0"
                        value={loan.emi}
                        onChange={e => {
                          const arr = [...(answers.existingLoans || [])];

                          arr[i] = {
                            ...arr[i],
                            emi: e.target.value
                          };

                          set("existingLoans", arr);

                          set(
                            "existingEmi",
                            arr.reduce(
                              (sum, l) => sum + Number(l.emi || 0),
                              0
                            )
                          );
                        }}
                        placeholder="14,000"
                      />
                    </div>
                  </Field>
                </div>

                <div className="two-col">
                  <Field label="Months remaining">
                    <input
                      type="number"
                      min="0"
                      value={loan.monthsLeft}
                      onChange={e => {
                        const arr = [...(answers.existingLoans || [])];

                        arr[i] = {
                          ...arr[i],
                          monthsLeft: e.target.value
                        };

                        set("existingLoans", arr);
                      }}
                      placeholder="24"
                    />
                  </Field>

                  <Field label="Interest rate (optional)">
                    <div className="input-prefix">
                      <input
                        type="number"
                        min="0"
                        value={loan.rate || ""}
                        onChange={e => {
                          const arr = [...(answers.existingLoans || [])];

                          arr[i] = {
                            ...arr[i],
                            rate: e.target.value
                          };

                          set("existingLoans", arr);
                        }}
                        placeholder="9.5"
                      />
                      <span>%</span>
                    </div>
                  </Field>
                </div>
              </div>
            ))}

            <div className="mini-callout">
              <Gauge size={17} />
              <span>
                Current total EMI:{" "}
                <b>
                  {formatINR(
                    (answers.existingLoans || []).reduce(
                      (sum, l) => sum + Number(l.emi || 0),
                      0
                    )
                  )}
                  /month
                </b>
                . Each EMI is also tracked by months remaining so future
                repayment relief can be explained.
              </span>
            </div>

            <div className="two-col">
              <Field
                label="Approx. rate on existing debt (optional)"
                hint="Useful for identifying expensive debt."
              >
                <div className="input-prefix">
                  <input
                    type="number"
                    value={answers.existingDebtRate}
                    onChange={e =>
                      set("existingDebtRate", e.target.value)
                    }
                    placeholder="30"
                  />
                  <span>%</span>
                </div>
              </Field>

              <Field label="Emergency savings (months)">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={answers.emergencySavingsMonths}
                  onChange={e =>
                    set("emergencySavingsMonths", e.target.value)
                  }
                  placeholder="3"
                />
              </Field>
            </div>

            {answers.incomeType === "selfEmployed" && (
              <Field
                label="Unencumbered collateral value (optional)"
                hint="Collateral may open secured options; it does not increase your safe EMI."
              >
                <div className="input-prefix">
                  <span>₹</span>
                  <input
                    type="number"
                    value={answers.collateralValue}
                    onChange={e =>
                      set("collateralValue", e.target.value)
                    }
                    placeholder="45,00,000"
                  />
                </div>
              </Field>
            )}

            <div className="mini-callout">
              <Gauge size={17} />
              <span>
                Repayment capacity and collateral are kept separate:
                cash flow determines your safe EMI; collateral affects
                secured-product eligibility.
              </span>
            </div>
          </Step>
        )}

        {step === 5 && (
          <Step
            title="How strong is your credit picture?"
            desc="Unknown is allowed. We store exactly what you tell us and only use a separate numeric value internally for pricing bands."
          >
            <Field
              label="Credit score"
              hint="We display the exact score you enter; we never replace it with a band value."
            >
              <input
                type="number"
                min="300"
                max="900"
                value={answers.creditScore}
                onChange={e => set("creditScore", e.target.value)}
                placeholder="e.g. 735"
              />
            </Field>

            <Field
              label="Credit card utilisation (optional)"
              hint="Approximate percentage of your available card limit currently used."
            >
              <div className="input-prefix">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={answers.cardUtilisation}
                  onChange={e =>
                    set("cardUtilisation", e.target.value)
                  }
                  placeholder="70"
                />
                <span>%</span>
              </div>
            </Field>

            <Field label="Recent EMI bounces">
              <div className="choice-row">
                {[0, 1, 2].map(v => (
                  <Choice
                    key={v}
                    active={answers.bounces === v}
                    onClick={() => set("bounces", v)}
                  >
                    {v === 0 ? "None" : v === 1 ? "1" : "2+"}
                  </Choice>
                ))}
              </div>
            </Field>
          </Step>
        )}

        {step === 6 && (
          <Step
            title="How predictable is your income — and what will this loan create?"
            desc="We only ask about productive returns when the borrowing is intended to generate income or profit."
          >
            <Field label="How stable is your income?">
              <div className="choice-row">
                {[
                  ["high", "Very stable"],
                  ["medium", "Mostly stable"],
                  ["low", "Variable / uncertain"]
                ].map(([v, l]) => (
                  <Choice
                    key={v}
                    active={answers.incomeStability === v}
                    onClick={() => set("incomeStability", v)}
                  >
                    {l}
                  </Choice>
                ))}
              </div>
            </Field>

            <Field label="Is this borrowing for consumption or to generate income?">
              <div className="choice-row">
                {[
                  ["consumption", "Consumption"],
                  ["productive", "Productive / business"]
                ].map(([v, l]) => (
                  <Choice
                    key={v}
                    active={answers.borrowingType === v}
                    onClick={() => set("borrowingType", v)}
                  >
                    {l}
                  </Choice>
                ))}
              </div>
            </Field>

            {answers.borrowingType === "productive" && (
              <Field
                label="Expected additional monthly profit/income"
                hint="Use a realistic amount after extra operating costs, not your best-case estimate."
              >
                <div className="input-prefix">
                  <span>₹</span>
                  <input
                    type="number"
                    value={answers.expectedMonthlyProfit}
                    onChange={e =>
                      set("expectedMonthlyProfit", e.target.value)
                    }
                    placeholder="30,000"
                  />
                </div>
              </Field>
            )}

            {answers.incomeType === "salaried" && (
              <Field
                label="Share of income that is variable/bonus (optional)"
                hint="If much of your income is variable, the safe number should not assume the bonus is guaranteed."
              >
                <div className="input-prefix">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={answers.variableIncomeShare}
                    onChange={e =>
                      set("variableIncomeShare", e.target.value)
                    }
                    placeholder="10"
                  />
                  <span>%</span>
                </div>
              </Field>
            )}

            {answers.product === "personal" && (
              <Field label="Major unavoidable expense expected in next 6–12 months? (optional)">
                <div className="input-prefix">
                  <span>₹</span>
                  <input
                    type="number"
                    value={answers.upcomingExpenses}
                    onChange={e =>
                      set("upcomingExpenses", e.target.value)
                    }
                    placeholder="0"
                  />
                </div>
              </Field>
            )}
          </Step>
        )}

        {step === 7 && (
          <Step
            title="A couple of details before we calculate."
            desc="These help us explain the result without storing your identity."
          >
            <div className="two-col">
              <Field label="First name">
                <input
                  value={answers.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="Optional"
                />
              </Field>

              <Field label="Age">
                <input
                  type="number"
                  value={answers.age}
                  onChange={e => set("age", e.target.value)}
                  placeholder="29"
                />
              </Field>
            </div>

            <Field label="City">
              <input
                value={answers.city}
                onChange={e => set("city", e.target.value)}
                placeholder="e.g. Bengaluru"
              />
            </Field>

            {answers.carLoanMonthsLeft && (
              <div className="mini-callout">
                <Info size={17} />
                <span>
                  Your existing car loan has{" "}
                  {answers.carLoanMonthsLeft} months left; the result will
                  show that this EMI is scheduled to fall away later.
                </span>
              </div>
            )}

            <div className="consent-box">
              <ShieldCheck size={20} />
              <div>
                <b>Your answers stay in this browser.</b>
                <p>
                  No login, bureau pull, or backend is used. This is a
                  self-assessment, not a lender approval.
                </p>
              </div>
            </div>
          </Step>
        )}

        <div className="question-footer">
          <span className={validationMessage ? "validation-message" : ""}>
            {validationMessage ||
              (step < 7
                ? "You can review before the final result."
                : "Ready to see your borrowing range.")}
          </span>

          <button className="primary" onClick={handleNext}>
            {step === 7 ? "See my numbers" : "Continue"}
            <ArrowRight size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}

function Step({ title, desc, children }) {
  return (
    <section className="question-card">
      <div className="eyebrow">Self-assessment</div>
      <h1>{title}</h1>
      <p>{desc}</p>
      {children}
    </section>
  );
}

function Choice({ active, onClick, children }) {
  return (
    <button
      type="button"
      className={`choice ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {active && <Check size={17} />}
      <span>{children}</span>
    </button>
  );
}

function Results({
  answers,
  result,
  onRestart,
  showAll,
  setShowAll
}) {
  const r = result;
  const name = answers.name || "Your";

  function printCard() {
    window.print();
  }

  return (
    <div className="app results-app">
      <nav>
        <div className="brand">
          <span className="brand-mark">L</span> borrower copilot
        </div>

        <div className="nav-actions">
          <button className="ghost" onClick={onRestart}>
            <RotateCcw size={15} /> Start over
          </button>

          <button className="ghost" onClick={printCard}>
            <Download size={15} /> Print / save card
          </button>
        </div>
      </nav>

      <main className="results">
        <div className="result-header">
          <div>
            <div className="eyebrow">Your borrowing assessment</div>

            <h1>
              {name === "Your"
                ? "Here’s your borrowing range."
                : `${name}, here’s your borrowing range.`}
            </h1>

            <p>
              Built from what you told us. Every number below can be traced
              back to an answer and a documented rule.
            </p>
          </div>

          <div className="confidence">
            <span>CONFIDENCE</span>
            <b>{r.riskConfidence}</b>
            <small>
              {r.riskConfidence === "Low"
                ? "More answers would narrow the range."
                : "Enough information for a useful first negotiation."}
            </small>
          </div>
        </div>

        <section className={`verdict ${r.verdictTone}`}>
          <div className="verdict-icon">
            {r.verdictTone === "good" ? (
              <CircleCheck />
            ) : r.verdictTone === "bad" ? (
              <CircleX />
            ) : (
              <AlertTriangle />
            )}
          </div>

          <div>
            <span>RECOMMENDATION</span>
            <h2>{r.verdict}</h2>
            <p>{r.reason}</p>
          </div>
        </section>

        <div className="section-heading">
          <span>01</span>
          <div>
            <h2>How much?</h2>
            <p>
              Don't confuse what a lender may sanction with what you can
              comfortably carry.
            </p>
          </div>
        </div>

        <section className="metric-grid two">
          <Metric
            icon={WalletCards}
            label="Estimated lender-style eligibility"
            value={formatINR(r.estimatedLenderAmount, true)}
            sub="Illustrative FOIR/product assumptions — actual lender approval may differ"
          />

          <Metric
            icon={ShieldCheck}
            label="Borrower safe amount"
            value={formatINR(r.safeAmount, true)}
            sub="The number we recommend you negotiate around"
            tone="accent"
          />
        </section>

        <Why>
          {r.lenderWhy}
          <br />
          <br />
          {r.safeWhy}
        </Why>

        <div className="result-note">
          <ShieldCheck size={16} />
          <span>
            <b>Collateral:</b> {r.collateralWhy}
          </span>
        </div>

        {r.productiveWhy && (
          <div className="result-note">
            <Gauge size={16} />
            <span>
              <b>Productive return:</b> {r.productiveWhy}
            </span>
          </div>
        )}

        <div className="section-heading">
          <span>02</span>
          <div>
            <h2>What rate is fair?</h2>
            <p>
              A band is more honest than pretending we know an exact offer.
            </p>
          </div>
        </div>

        <section className="rate-panel">
          <div>
            <small>FAIR RATE RANGE</small>
            <strong>
              {r.rateLow.toFixed(1)}–{r.rateHigh.toFixed(1)}%
            </strong>
            <span>expected annual interest</span>
          </div>

          <div className="rate-divider" />

          <div>
            <small>EST. FIRST-YEAR APR</small>
            <strong>{r.aprEstimate.toFixed(1)}%</strong>
            <span>
              includes an assumed{" "}
              {((r.fee / r.wanted) * 100 || 0).toFixed(1)}%
              processing fee
            </span>
          </div>

          <div className="rate-explain">
            <Percent size={18} />

            <p>
              {r.creditScoreDisplay !== "Unknown"
                ? `Your ${r.creditScoreDisplay} credit score ${
                    Number(r.creditScoreDisplay) >= 750
                      ? "supports the lower end of the range."
                      : "pushes the range upward."
                  }`
                : "You don't know your score, so we keep the rate range wider rather than inventing a score."}
            </p>
          </div>
        </section>

        <Why>
          The rate starts from a product band, then adjusts for credit
          evidence, income stability and secured collateral where applicable.
          The APR estimate adds the assumed processing fee; actual lender APR
          will depend on the final sanction, fees and terms.
        </Why>

        <div className="section-heading">
          <span>03</span>
          <div>
            <h2>What EMI should you agree to?</h2>
            <p>
              Your monthly ceiling matters more than the maximum loan
              headline.
            </p>
          </div>
        </div>

        <section className="emi-card">
          <div className="emi-main">
            <small>SAFE MONTHLY EMI</small>
            <strong>{formatINR(r.safeEmi)}</strong>
            <p>
              We would not negotiate above this without a clear reason.
            </p>
          </div>

          <div className="emi-side">
            <div>
              <span>Requested EMI</span>
              <b>{formatINR(r.proposedEmi)}</b>
            </div>

            <div>
              <span>Existing EMI</span>
              <b>{formatINR(r.existingEmi)}</b>
            </div>

            <div>
              <span>Total after new loan</span>
              <b>
                {formatINR(r.existingEmi + r.proposedEmi)}
              </b>
            </div>
          </div>
        </section>

        <section className="tenure">
          <div>
            <h3>Recommended tenure</h3>
            <p>{r.recommendedTenureReason}</p>
          </div>

          <div className="trade-row">
            <div>
              <span>Recommended</span>
              <b>{r.recommendedTenure ? `${r.recommendedTenure} years` : "Reduce amount"}</b>
              {r.recommendedTenure && <small>{formatINR(r.recommendedTenureEmi)}/mo</small>}
            </div>

            {r.fasterTenure && (
              <div>
                <span>Repay faster</span>
                <b>{r.fasterTenure} years</b>
                <small>{formatINR(r.fasterTenureEmi)}/mo</small>
              </div>
            )}

            {r.lowerEmiTenure && (
              <div>
                <span>Lower EMI</span>
                <b>{r.lowerEmiTenure} years</b>
                <small>{formatINR(r.lowerEmiTenureEmi)}/mo</small>
              </div>
            )}
          </div>

          <Why>
            Recommended tenure is the shortest whole-year tenure that keeps the requested EMI around or below 80% of your safe EMI ceiling where possible. Shorter tenure saves interest but raises EMI; longer tenure lowers EMI but increases total interest.
          </Why>
        </section>

        {r.recommendedTenure && r.recommendedTenure !== r.tenure && (
          <section className="mini-callout">
            <SlidersHorizontal size={17} />
            <span>
              {r.recommendedTenure > r.tenure ? (
                <>
                  <b>Consider extending to {r.recommendedTenure} years.</b>{" "}
                  Your EMI at that tenure would be about {formatINR(r.recommendedTenureEmi)}/month, giving you more monthly headroom.
                </>
              ) : (
                <>
                  <b>Consider repaying in {r.recommendedTenure} years.</b>{" "}
                  Your EMI would be about {formatINR(r.recommendedTenureEmi)}/month, which can reduce total interest versus the current {r.tenure}-year choice.
                </>
              )}
            </span>
          </section>
        )}

        {r.recommendedTenure && r.recommendedTenure === r.tenure && (
          <section className="mini-callout">
            <SlidersHorizontal size={17} />
            <span>
              <b>Your chosen tenure is reasonable.</b>{" "}
              The {r.tenure}-year option keeps the requested EMI around {formatINR(r.recommendedTenureEmi)}/month with useful headroom below the safe ceiling.
            </span>
          </section>
        )}

        {!r.recommendedTenure && r.wanted > 0 && (
          <section className="mini-callout">
            <AlertTriangle size={17} />
            <span>
              <b>No available tenure makes this requested amount affordable.</b>{" "}
              Reduce the loan amount rather than stretching repayment beyond the prototype's {r.maxTenure}-year input boundary.
            </span>
          </section>
        )}

        <div className="section-heading">
          <span>04</span>
          <div>
            <h2>Stress test</h2>
            <p>What if income drops by 20%?</p>
          </div>
        </div>

        <section
          className={`stress ${
            r.stressEmiCapacity < r.proposedEmi
              ? "bad"
              : "good"
          }`}
        >
          <div className="stress-icon">
            <Gauge />
          </div>

          <div>
            <small>STRESSED EMI CAPACITY</small>
            <strong>{formatINR(r.stressEmiCapacity)}/month</strong>

            <p>
              With income at {formatINR(r.stressIncome)}/month and the same
              household expenses.{" "}
              {r.stressEmiCapacity < r.proposedEmi
                ? "The requested EMI would be uncomfortable under stress."
                : "The requested EMI still has some headroom."}
            </p>
          </div>
        </section>

        <div className="section-heading card-heading">
          <span>05</span>
          <div>
            <h2>Negotiation Card</h2>
            <p>Take this screen into the branch.</p>
          </div>
        </div>

        <section className="negotiation-card" id="negotiation-card">
          <div className="nc-head">
            <div>
              <small>LOKTA · BORROWER COPILOT</small>
              <h2>My borrowing card</h2>
            </div>
            <ShieldCheck size={25} />
          </div>

          <div className="nc-verdict">
            <span>MY RECOMMENDATION</span>
            <b>{r.verdict}</b>
          </div>

          <div className="nc-numbers">
            <div>
              <small>SAFE AMOUNT</small>
              <b>{formatINR(r.safeAmount, true)}</b>
            </div>

            <div>
              <small>FAIR RATE</small>
              <b>
                {r.rateLow.toFixed(1)}–{r.rateHigh.toFixed(1)}%
              </b>
            </div>

            <div>
              <small>SAFE EMI</small>
              <b>{formatINR(r.safeEmi, true)}/mo</b>
            </div>
          </div>

          <div className="nc-reasons">
            <b>Why these numbers?</b>

            <ul>
              <li>
                Income used: {formatINR(r.incomeForUnderwriting)}/month
              </li>

              <li>
                Current existing EMIs: {formatINR(r.existingEmi)}/month
              </li>

              <li>
                Other household income counted for cash flow:{" "}
                {formatINR(r.householdOtherIncome)}/month
              </li>

              <li>
                Credit evidence: {r.creditScoreDisplay}
              </li>

              <li>Product route: {r.route}</li>

              {answers.carLoanMonthsLeft && (
                <li>
                  Existing car EMI ends in:{" "}
                  {answers.carLoanMonthsLeft} months
                </li>
              )}

              <li>
                Collateral:{" "}
                {r.collateral
                  ? formatINR(r.collateral)
                  : "None provided"}
              </li>
            </ul>
          </div>

          {r.recommendedTenure && r.recommendedTenure !== r.tenure && (
            <div className="nc-script">
              <b>Suggested structure:</b>{" "}
              {r.recommendedTenure}-year tenure at about {formatINR(r.recommendedTenureEmi)}/month.{" "}
              {r.recommendedTenure > r.tenure
                ? "I prefer the longer tenure because it brings the EMI down and leaves more monthly headroom."
                : "I prefer the shorter tenure because I can afford the EMI and it reduces total interest."}
            </div>
          )}

          {r.recommendedTenure && r.recommendedTenure === r.tenure && (
            <div className="nc-script">
              <b>Suggested structure:</b>{" "}
              {r.tenure}-year tenure at about {formatINR(r.recommendedTenureEmi)}/month, within my target EMI headroom.
            </div>
          )}

          {!r.recommendedTenure && r.wanted > 0 && (
            <div className="nc-script">
              <b>Requested amount needs to come down:</b>{" "}
              no available tenure brings the EMI within my safe ceiling.
            </div>
          )}

          <div className="nc-script">
            “Please show me the APR and total repayment. My fair-rate range is{" "}
            <b>
              {r.rateLow.toFixed(1)}–{r.rateHigh.toFixed(1)}%
            </b>{" "}
            and my safe EMI ceiling is{" "}
            <b>{formatINR(r.safeEmi)}/month</b>. What explains any quote
            above that?”
          </div>

          <div className="nc-foot">
            Self-assessment only · Assumptions documented in RULES.md ·
            Not a lender approval
          </div>
        </section>

        <button
          className="show-rules"
          onClick={() => setShowAll(!showAll)}
        >
          <SlidersHorizontal size={16} />
          {showAll
            ? "Hide calculation details"
            : "Show calculation details"}
          <ChevronDown size={17} />
        </button>

        {showAll && (
          <section className="details">
            <div>
              <span>FOIR ceiling</span>
              <b>{Math.round(r.foir * 100)}%</b>
            </div>

            <div>
              <span>Max total debt</span>
              <b>{formatINR(r.maxTotalDebt)}/mo</b>
            </div>

            <div>
              <span>FOIR EMI available</span>
              <b>{formatINR(r.foirEmi)}/mo</b>
            </div>

            <div>
              <span>Cash-flow EMI available</span>
              <b>{formatINR(r.discretionaryEmi)}/mo</b>
            </div>

            <div>
              <span>Processing fee assumption</span>
              <b>
                {((r.fee / r.wanted) * 100 || 0).toFixed(1)}%
              </b>
            </div>

            <div>
              <span>Rate adjustment</span>
              <b>
                {r.riskAdjustment >= 0 ? "+" : ""}
                {r.riskAdjustment.toFixed(1)} pts
              </b>
            </div>
          </section>
        )}

        <div className="limits">
          <Info size={17} />

          <p>
            <b>What this app does not know:</b> bureau history,
            lender-specific policy, employment verification, exact fees,
            collateral legal checks, bank statements, or future income.
            Treat the output as a negotiation baseline, not an approval.
            The “estimated lender-style eligibility” is an illustrative
            calculation, not a prediction of a specific lender’s sanction.
          </p>
        </div>
      </main>

      <footer>
        Borrower Copilot · A transparent self-assessment for better lending
        conversations.
      </footer>
    </div>
  );
}
