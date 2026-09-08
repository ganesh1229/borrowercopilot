// Borrower Copilot — one central reasoning pipeline.
// Prototype assumptions for the Lokta challenge; not lender underwriting policy.

export const RULES = {
  foir: {
    salaried: 0.45,
    selfEmployed: 0.40,
    informal: 0.35,
  },

  livingBuffer: {
    salaried: 0.15,
    selfEmployed: 0.18,
    informal: 0.22,
  },

  rateBands: {
    personal: [10.5, 16.5],
    business: [11.5, 19.0],
    lap: [9.5, 13.5],
    vehicle: [9.5, 15.5],
    home: [8.0, 10.5],
    other: [11.0, 18.0],
  },

  processingFee: {
    personal: 0.02,
    business: 0.02,
    lap: 0.01,
    vehicle: 0.015,
    home: 0.005,
    other: 0.02,
  },

  // Prototype input boundary only.
  // This does NOT claim every lender/product offers 30 years.
  maxTenureYears: {
    personal: 30,
    business: 30,
    lap: 30,
    vehicle: 30,
    home: 30,
    other: 30,
  },

  stressIncomeDrop: 0.20,
  collateralLtv: 0.60,
  securedLenderUplift: 1.35,
  highUtilisation: 0.80,
  severeFoir: 0.55,
  minimumEmergencyMonths: 1,
};

export const PRODUCT_LABELS = {
  personal: "Personal loan",
  business: "Business loan",
  lap: "Loan against property",
  vehicle: "Vehicle loan",
  home: "Home loan",
  other: "Other loan",
};

export function monthlyEmi(principal, annualRate, years) {
  if (!principal || principal <= 0 || !years) return 0;

  const r = annualRate / 100 / 12;
  const n = years * 12;

  if (r === 0) return principal / n;

  return (
    principal *
    r *
    Math.pow(1 + r, n) /
    (Math.pow(1 + r, n) - 1)
  );
}

export function loanFromEmi(emi, annualRate, years) {
  if (!emi || emi <= 0 || !years) return 0;

  const r = annualRate / 100 / 12;
  const n = years * 12;

  if (r === 0) return emi * n;

  return (
    emi *
    (Math.pow(1 + r, n) - 1) /
    (r * Math.pow(1 + r, n))
  );
}

export function formatINR(n, compact = false) {
  const value = Math.max(0, Math.round(Number(n) || 0));

  if (compact) {
    if (value >= 10000000) {
      return `₹${(value / 10000000).toFixed(1)}Cr`;
    }

    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }

    if (value >= 1000) {
      return `₹${Math.round(value / 1000)}K`;
    }
  }

  return `₹${value.toLocaleString("en-IN")}`;
}

function numberOrZero(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function profileRisk(a) {
  const score =
    a.creditScore === "" || a.creditScore == null
      ? null
      : Number(a.creditScore);

  let adjustment = 0;
  let confidence = "Medium";
  const reasons = [];

  if (score === null || !Number.isFinite(score)) {
    adjustment += 1.5;
    confidence = "Low";
    reasons.push(
      "credit score is unknown, so the rate band stays wider"
    );
  } else if (score >= 780) {
    adjustment -= 1.2;
    reasons.push(
      `credit score ${score} supports the lower end of the range`
    );
  } else if (score >= 750) {
    adjustment -= 0.7;
    reasons.push(
      `credit score ${score} supports relatively strong pricing`
    );
  } else if (score >= 700) {
    adjustment += 0.2;
    reasons.push(
      `credit score ${score} is near-neutral for this prototype`
    );
  } else if (score >= 650) {
    adjustment += 1.5;
    reasons.push(
      `credit score ${score} pushes pricing upward`
    );
  } else {
    adjustment += 3;
    confidence = "Low";
    reasons.push(
      `credit score ${score} indicates higher pricing risk`
    );
  }

  if (numberOrZero(a.bounces) > 0) {
    adjustment += 2.5;
    confidence = "Low";

    reasons.push(
      `${a.bounces} recent EMI bounce${
        a.bounces > 1 ? "s" : ""
      } increases risk`
    );
  }

  if (a.incomeStability === "high") {
    adjustment -= 0.5;
    reasons.push("stable income improves confidence");
  }

  if (a.incomeStability === "low") {
    adjustment += 1.5;
    confidence = "Low";
    reasons.push("variable income increases uncertainty");
  }

  const utilisation =
    numberOrZero(a.cardUtilisation) / 100;

  if (utilisation >= RULES.highUtilisation) {
    adjustment += 1.5;
    confidence = "Low";

    reasons.push(
      `credit utilisation is ${numberOrZero(
        a.cardUtilisation
      )}%`
    );
  }

  return {
    adjustment,
    confidence,
    reasons,
    score,
  };
}

function getRoute(a) {
  const collateral = numberOrZero(a.collateralValue);
  const productive = a.borrowingType === "productive";

  if (a.incomeType === "selfEmployed" && collateral > 0) {
    return "Secured business / LAP route";
  }

  if (a.product === "vehicle") {
    return "Vehicle loan";
  }

  if (a.product === "home") {
    return "Home loan";
  }

  if (
    productive &&
    a.incomeType === "selfEmployed"
  ) {
    return "Business loan";
  }

  if (a.product === "personal") {
    return "Personal loan";
  }

  return (
    PRODUCT_LABELS[a.product] ||
    "Loan route to be confirmed"
  );
}

export function calculate(a) {
  const income = numberOrZero(a.income);
  const expenses = numberOrZero(a.expenses);

  const loans = Array.isArray(a.existingLoans)
    ? a.existingLoans
    : [];

  const legacyExistingEmi =
    numberOrZero(a.existingEmi);

  const existingEmi = loans.length
    ? loans.reduce(
        (sum, loan) =>
          sum + numberOrZero(loan.emi),
        0
      )
    : legacyExistingEmi;

  const householdOtherIncome =
    numberOrZero(a.householdOtherIncome);

  const householdIncome =
    income + householdOtherIncome;

  const wanted = numberOrZero(a.amount);
  const collateral =
    numberOrZero(a.collateralValue);

  const expectedProfit =
    numberOrZero(a.expectedMonthlyProfit);

  const emergencyMonths =
    numberOrZero(a.emergencySavingsMonths);

  const utilisation =
    numberOrZero(a.cardUtilisation);

  const type = a.incomeType || "salaried";
  const product = a.product || "personal";

  // For self-employed borrowers, use the lower of
  // stated income and documented ITR income.
  const itrMonthly =
    numberOrZero(a.itrIncome);

  const incomeForUnderwriting =
    type === "selfEmployed" &&
    itrMonthly > 0
      ? Math.min(income, itrMonthly)
      : income;

  const foir =
    RULES.foir[type] || 0.40;

  const lenderTotalDebtCeiling =
    incomeForUnderwriting * foir;

  const lenderEmiCapacity =
    Math.max(
      0,
      lenderTotalDebtCeiling - existingEmi
    );

  // Borrower-safe affordability uses household cash flow.
  const residualCash = Math.max(
    0,
    householdIncome -
      expenses -
      existingEmi
  );

  const cashFlowEmiCapacity =
    residualCash *
    (
      1 -
      (RULES.livingBuffer[type] || 0.18)
    );

  const risk = profileRisk(a);

  const baseBand =
    RULES.rateBands[product] ||
    RULES.rateBands.personal;

  const baseRate =
    (baseBand[0] + baseBand[1]) / 2 +
    risk.adjustment;

  let [rateLow, rateHigh] = baseBand;

  rateLow += risk.adjustment;
  rateHigh += risk.adjustment;

  if (
    product === "lap" &&
    collateral > 0
  ) {
    rateLow -= 0.4;
    rateHigh -= 0.4;
  }

  rateLow = Math.max(7.5, rateLow);
  rateHigh = Math.min(24, rateHigh);

  const midpointRate =
    (rateLow + rateHigh) / 2;

  // Prototype tenure boundary.
  const maxTenure =
    RULES.maxTenureYears[product] || 30;

  const tenure = Math.min(
    Math.max(
      1,
      numberOrZero(a.tenure) || 5
    ),
    maxTenure
  );

  // Illustrative lender-style amount.
  const incomeBasedLenderAmount =
    loanFromEmi(
      lenderEmiCapacity,
      midpointRate,
      tenure
    );

  let estimatedLenderAmount =
    incomeBasedLenderAmount;

  let collateralCeiling = null;

  if (collateral > 0) {
    collateralCeiling =
      collateral * RULES.collateralLtv;
  }

  if (
    product === "lap" &&
    collateralCeiling !== null
  ) {
    estimatedLenderAmount = Math.min(
      collateralCeiling,
      incomeBasedLenderAmount *
        RULES.securedLenderUplift
    );
  }

  if (
    product === "vehicle" &&
    wanted > 0
  ) {
    estimatedLenderAmount =
      Math.min(
        estimatedLenderAmount,
        wanted * 0.90
      );
  }

  // Borrower-safe EMI.
  let safeEmi = Math.min(
    lenderEmiCapacity,
    cashFlowEmiCapacity
  );

  const reductions = [];

  if (
    risk.score !== null &&
    risk.score < 700
  ) {
    safeEmi *= 0.90;

    reductions.push(
      "10% buffer for lower credit evidence"
    );
  }

  if (risk.score === null) {
    safeEmi *= 0.95;

    reductions.push(
      "5% uncertainty buffer because credit score is unknown"
    );
  }

  if (numberOrZero(a.bounces) > 0) {
    safeEmi *= 0.70;

    reductions.push(
      "30% repayment buffer after a recent bounce"
    );
  }

  if (
    utilisation / 100 >=
    RULES.highUtilisation
  ) {
    safeEmi *= 0.85;

    reductions.push(
      "15% buffer for high card utilisation"
    );
  }

  if (
    emergencyMonths > 0 &&
    emergencyMonths < 3
  ) {
    safeEmi *= 0.90;

    reductions.push(
      "10% cash-buffer adjustment for less than 3 months savings"
    );
  }

  safeEmi = Math.max(0, safeEmi);

  const safeAmountBeforeVerdict =
    loanFromEmi(
      safeEmi,
      midpointRate,
      tenure
    );

  const proposedEmi =
    monthlyEmi(
      wanted,
      midpointRate,
      tenure
    );

  // Productive borrowing does not increase repayment capacity.
  const productiveCoverage =
    expectedProfit > 0
      ? expectedProfit /
        Math.max(1, proposedEmi)
      : null;

  // Stress scenario: borrower's income drops 20%.
  const stressIncome =
    income *
    (1 - RULES.stressIncomeDrop);

  const stressHouseholdIncome =
    stressIncome +
    householdOtherIncome;

  const stressResidualCash =
    Math.max(
      0,
      stressHouseholdIncome -
        expenses -
        existingEmi
    );

  const stressFoirEmi =
    Math.max(
      0,
      stressIncome * foir -
        existingEmi
    );

  const stressEmiCapacity =
    Math.max(
      0,
      Math.min(
        stressFoirEmi,
        stressResidualCash *
        (
          1 -
          (RULES.livingBuffer[type] || 0.18)
        )
      )
    );

  const severeFoir =
    incomeForUnderwriting > 0 &&
    existingEmi /
      incomeForUnderwriting >=
      0.50;

  const noCashAfterEssentials =
    residualCash <= 0;

  const recentBounce =
    numberOrZero(a.bounces) > 0;

  const expensiveDebt =
    numberOrZero(a.existingDebtRate) >=
    24;

  const highUtilisation =
    utilisation / 100 >=
    RULES.highUtilisation;

  const weakBuffer =
    emergencyMonths > 0 &&
    emergencyMonths <=
      RULES.minimumEmergencyMonths;

  const productiveFailure =
    a.borrowingType === "productive" &&
    expectedProfit > 0 &&
    expectedProfit < proposedEmi;

  const stressFailure =
    proposedEmi >
    stressEmiCapacity;

  const severeDistress =
    noCashAfterEssentials ||
    (
      recentBounce &&
      (
        severeFoir ||
        expensiveDebt ||
        type === "informal"
      )
    ) ||
    (
      severeFoir &&
      (
        highUtilisation ||
        weakBuffer
      )
    );

  let verdict = "Borrow";
  let verdictTone = "good";

  let reason =
    "Your requested borrowing is within the borrower-safe repayment range.";

  let safeAmount =
    safeAmountBeforeVerdict;

  // =========================================================
  // ADAPTIVE TENURE RECOMMENDATION
  // =========================================================

  const tenureCandidates = Array.from(
    { length: maxTenure },
    (_, i) => i + 1
  );

  // Target approximately 80% of the safe EMI ceiling.
  // This creates breathing room instead of using the full ceiling.
  const targetSafeEmi =
    safeEmi * 0.80;

  // Find the shortest tenure that gives a comfortable EMI.
  const targetTenure =
    wanted > 0 &&
    targetSafeEmi > 0
      ? tenureCandidates.find(
          years =>
            monthlyEmi(
              wanted,
              midpointRate,
              years
            ) <= targetSafeEmi
        ) || null
      : null;

  // If 80% cannot be achieved, find the shortest tenure
  // that at least stays within the actual safe EMI ceiling.
  const safeTenureRecommendation =
    wanted > 0 &&
    safeEmi > 0
      ? tenureCandidates.find(
          years =>
            monthlyEmi(
              wanted,
              midpointRate,
              years
            ) <= safeEmi
        ) || null
      : null;

  const recommendedTenure =
    targetTenure ||
    safeTenureRecommendation ||
    null;

  const recommendedTenureEmi =
    recommendedTenure
      ? monthlyEmi(
          wanted,
          midpointRate,
          recommendedTenure
        )
      : null;

  const recommendedTenureStatus =
    !recommendedTenure
      ? "reduce-amount"
      : recommendedTenure === tenure
        ? "current-is-reasonable"
        : recommendedTenure > tenure
          ? "extend"
          : "shorten";

  const recommendedTenureReason =
    !recommendedTenure
      ? `No tenure up to ${maxTenure} years brings the requested amount within the safe EMI ceiling. Reduce the loan amount.`
      : recommendedTenure > tenure
        ? `Your requested EMI is high relative to your safe ceiling. Extending to ${recommendedTenure} years lowers the EMI to about ${formatINR(
            recommendedTenureEmi
          )}/month.`
        : recommendedTenure < tenure
          ? `Your cash-flow capacity supports paying this loan faster. A ${recommendedTenure}-year tenure keeps the EMI around ${formatINR(
              recommendedTenureEmi
            )}/month while reducing total interest versus a longer tenure.`
          : `Your current ${tenure}-year tenure is reasonable: the EMI is about ${formatINR(
              recommendedTenureEmi
            )}/month and stays within a comfortable share of your safe ceiling.`;

  // Offer a faster option only when it remains safe.
  const fasterTenure =
    recommendedTenure &&
    recommendedTenure > 1 &&
    monthlyEmi(
      wanted,
      midpointRate,
      recommendedTenure - 1
    ) <= safeEmi
      ? recommendedTenure - 1
      : null;

  const fasterTenureEmi =
    fasterTenure
      ? monthlyEmi(
          wanted,
          midpointRate,
          fasterTenure
        )
      : null;

  // Offer a lower-EMI option when a longer tenure exists.
  const lowerEmiTenure =
    recommendedTenure &&
    recommendedTenure < maxTenure
      ? recommendedTenure + 1
      : null;

  const lowerEmiTenureEmi =
    lowerEmiTenure
      ? monthlyEmi(
          wanted,
          midpointRate,
          lowerEmiTenure
        )
      : null;

  // Backward-compatible names used by the current App.jsx.
  const suggestedTenure =
    recommendedTenure;

  const suggestedTenureEmi =
    recommendedTenureEmi;

  const tenureSolvesRequest =
    Boolean(
      recommendedTenure &&
      recommendedTenure >= tenure
    );

  // =========================================================
  // VERDICT
  // =========================================================

  if (severeDistress) {
    verdict = "Don't borrow";
    verdictTone = "bad";
    safeAmount = 0;

    const reasons = [];

    if (noCashAfterEssentials) {
      reasons.push(
        "there is no monthly cash left after essentials and existing EMIs"
      );
    }

    if (recentBounce) {
      reasons.push(
        "there is a recent repayment bounce"
      );
    }

    if (expensiveDebt) {
      reasons.push(
        "existing debt is high-cost"
      );
    }

    if (severeFoir) {
      reasons.push(
        "existing EMI burden is already very high"
      );
    }

    if (highUtilisation) {
      reasons.push(
        "credit utilisation is high"
      );
    }

    if (weakBuffer) {
      reasons.push(
        "emergency savings are thin"
      );
    }

    if (productiveFailure) {
      reasons.push(
        "expected additional profit does not cover the proposed EMI"
      );
    }

    reason =
      `We would not add new borrowing now because ${
        reasons.slice(0, 2).join(" and ")
      }. Stabilize the existing position first.`;

  } else if (wanted > safeAmount) {
    verdict = "Borrow less";
    verdictTone = "warn";

    reason =
      `The estimated lender-style amount can be higher than your borrower-safe amount. Use ${formatINR(
        safeAmount
      )} as the negotiation ceiling rather than borrowing the maximum.`;
  }

  // =========================================================
  // COST / APR
  // =========================================================

  const fee =
    wanted *
    (
      RULES.processingFee[product] ||
      0.02
    );

  const firstYearInterest =
    wanted *
    midpointRate /
    100;

  const aprEstimate =
    wanted > 0
      ? (
          (
            firstYearInterest +
            fee
          ) /
          wanted
        ) *
        100
      : midpointRate;

  // =========================================================
  // EXPLANATIONS
  // =========================================================

  const lenderWhy =
    product === "lap" &&
    collateralCeiling !== null
      ? `Income-based lender-style amount is ${formatINR(
          incomeBasedLenderAmount
        )}; collateral of ${formatINR(
          collateral
        )} adds secured headroom using a ${Math.round(
          RULES.securedLenderUplift * 100 - 100
        )}% illustrative uplift, capped at ${formatINR(
          collateralCeiling
        )} by LTV.`
      : `Income used: ${formatINR(
          incomeForUnderwriting
        )}/month × ${Math.round(
          foir * 100
        )}% FOIR, less ${formatINR(
          existingEmi
        )} existing EMI; product/tenure constraints are then applied.`;

  const safeWhy =
    safeAmount === 0
      ? "Safe amount is ₹0 because a documented distress rule fired; the app does not present a non-zero safe amount alongside a Don't borrow verdict."
      : `Safe EMI starts from the lower of lender-style capacity ${formatINR(
          lenderEmiCapacity
        )} and household cash-flow capacity ${formatINR(
          cashFlowEmiCapacity
        )}, then applies ${
          reductions.length
            ? reductions.join("; ")
            : "no extra risk buffer"
        }. At ${midpointRate.toFixed(
          1
        )}% for ${tenure} years this equals about ${formatINR(
          safeAmount
        )}.`;

  const stressWhy =
    `Borrower income stress-tested at ${formatINR(
      stressIncome
    )}/month (20% lower). ${
      householdOtherIncome > 0
        ? `Adding ${formatINR(
            householdOtherIncome
          )}/month of other household income, `
        : ""
    }after ${formatINR(
      expenses
    )} household expenses and ${formatINR(
      existingEmi
    )} existing EMI, the same rules leave ${formatINR(
      stressEmiCapacity
    )}/month for a new EMI. Requested EMI is ${formatINR(
      proposedEmi
    )}.`;

  const collateralWhy =
    collateral > 0
      ? `Collateral of ${formatINR(
          collateral
        )} may support a secured route; at the prototype ${Math.round(
          RULES.collateralLtv * 100
        )}% LTV assumption, the illustrative collateral ceiling is ${formatINR(
          collateralCeiling
        )}. It does not increase your safe EMI.`
      : "No collateral was provided, so no secured-product ceiling is shown.";

  const productiveWhy =
    a.borrowingType === "productive"
      ? expectedProfit > 0
        ? `Expected additional monthly profit is ${formatINR(
            expectedProfit
          )} versus proposed EMI ${formatINR(
            proposedEmi
          )}; this is a sustainability signal, not extra borrowing capacity.`
        : "No expected additional profit was provided, so the productive-return test remains wide/unknown."
      : null;

  // =========================================================
  // RETURN
  // =========================================================

  return {
    wanted,
    income,
    incomeForUnderwriting,
    expenses,
    existingEmi,
    existingLoans: loans,

    householdOtherIncome,
    householdIncome,

    foir,

    lenderEmiCapacity,
    cashFlowEmiCapacity,

    maxTotalDebt:
      lenderTotalDebtCeiling,

    foirEmi:
      lenderEmiCapacity,

    discretionaryEmi:
      cashFlowEmiCapacity,

    estimatedLenderAmount:
      Math.max(
        0,
        estimatedLenderAmount
      ),

    incomeBasedLenderAmount,

    safeEmi,
    safeAmount,

    rateLow,
    rateHigh,
    midpointRate,

    tenure,
    maxTenure,

    fee,
    aprEstimate,
    proposedEmi,

    stressIncome,
    stressEmiCapacity,

    verdict,
    verdictTone,
    reason,

    route: getRoute(a),

    riskConfidence:
      risk.confidence,

    riskReasons:
      risk.reasons,

    riskAdjustment:
      risk.adjustment,

    creditScoreDisplay:
      a.creditScore === "" ||
      a.creditScore == null
        ? "Unknown"
        : String(a.creditScore),

    collateral,
    collateralCeiling,
    collateralWhy,

    productiveCoverage,
    productiveWhy,

    lenderWhy,
    safeWhy,
    stressWhy,

    reductions,

    severeDistress,
    expensiveDebt,
    highUtilisation,
    emergencyMonths,

    // Legacy fields retained for compatibility.
    interestAt3:
      monthlyEmi(
        wanted,
        midpointRate,
        3
      ) *
      36 -
      wanted,

    interestAt5:
      monthlyEmi(
        wanted,
        midpointRate,
        Math.min(5, tenure)
      ) *
      Math.min(5, tenure) *
      12 -
      wanted,

    emiAt3Years:
      monthlyEmi(
        wanted,
        midpointRate,
        3
      ),

    emiAt5Years:
      monthlyEmi(
        wanted,
        midpointRate,
        Math.min(5, tenure)
      ),

    safeTenure:
      Math.min(5, tenure),

    // New adaptive tenure outputs.
    targetSafeEmi,

    recommendedTenure,
    recommendedTenureEmi,
    recommendedTenureStatus,
    recommendedTenureReason,

    fasterTenure,
    fasterTenureEmi,

    lowerEmiTenure,
    lowerEmiTenureEmi,

    // Compatibility with current App.jsx.
    suggestedTenure,
    suggestedTenureEmi,
    tenureSolvesRequest,

    stressFailure,
    baseRate,
  };
}

export const PERSONAS = {
  priya: {
    name: "Priya",
    age: 29,
    city: "Bengaluru",

    incomeType: "salaried",
    product: "personal",
    purpose: "Wedding",

    borrowingType: "consumption",

    amount: 800000,
    income: 110000,

    existingEmi: 14000,
    expenses: 28000,

    creditScore: "780",
    bounces: 0,

    incomeStability: "high",

    tenure: 5,

    existingDebtRate: 9.5,
    emergencySavingsMonths: 4,

    carLoanMonthsLeft: 24,
    variableIncomeShare: 0,

    householdOtherIncome: 0,

    existingLoans: [
      {
        type: "Car loan",
        emi: 14000,
        monthsLeft: 24,
        rate: 9.5,
      },
    ],
  },

  ravi: {
    name: "Ravi",
    age: 42,
    city: "Mysuru",

    incomeType: "selfEmployed",
    product: "lap",
    purpose: "Business expansion",

    borrowingType: "productive",

    amount: 1500000,
    income: 60000,
    itrIncome: 35000,

    existingEmi: 0,
    expenses: 26000,

    creditScore: "",
    bounces: 0,

    incomeStability: "medium",

    collateralValue: 4500000,

    tenure: 7,

    expectedMonthlyProfit: 20000,

    existingDebtRate: 0,

    householdOtherIncome: 18000,
    otherIncomeStability: "high",

    existingLoans: [],

    emergencySavingsMonths: 3,
    cardUtilisation: 20,
  },

  anita: {
    name: "Anita",
    age: 35,
    city: "Hubballi",

    incomeType: "informal",
    product: "vehicle",
    purpose: "Electric scooter for delivery",

    borrowingType: "productive",

    amount: 150000,
    income: 28000,

    existingEmi: 10500,
    expenses: 12000,

    creditScore: "",
    bounces: 1,

    incomeStability: "low",

    tenure: 5,

    expectedMonthlyProfit: 8000,

    existingDebtRate: 30,
    emergencySavingsMonths: 0,

    householdOtherIncome: 0,

    existingLoans: [
      {
        type: "App loan 1",
        emi: 3500,
        monthsLeft: 6,
        rate: 30,
      },
      {
        type: "App loan 2",
        emi: 3500,
        monthsLeft: 9,
        rate: 30,
      },
      {
        type: "App loan 3",
        emi: 3500,
        monthsLeft: 12,
        rate: 30,
      },
    ],
  },
};