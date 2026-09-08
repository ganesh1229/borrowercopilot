# Borrower Copilot — Rules & Assumptions

> Transparent self-assessment for the Lokta challenge. This is not lender underwriting, financial advice, or an approval prediction.

## Core design principle

The app keeps **lender-style eligibility** and **borrower-safe affordability** as two different calculations.

- **Estimated lender-style eligibility:** illustrative FOIR/product calculation. It is explicitly not a prediction of a specific lender's sanction.
- **Borrower-safe amount:** based on household cash flow and documented risk buffers. This is the number the borrower should use as the negotiation ceiling.
- **Collateral:** affects secured-product options and can improve illustrative lender-style headroom for a secured route. It does **not** increase safe EMI or replace repayment capacity.
- **Productive return:** expected additional monthly profit is a sustainability signal. It does **not** create repayment capacity out of thin air.

## Rules table

| What | Value | Why | Source |
|---|---:|---|---|
| Salaried FOIR | 45% | Lender-style repayment ceiling for prototype | My judgement |
| Self-employed FOIR | 40% | Lower ceiling for income/documentation variability | My judgement |
| Informal/variable FOIR | 35% | More conservative for less predictable income | My judgement |
| Salaried living buffer | 15% | Protects residual cash from being fully converted to EMI | My judgement |
| Self-employed living buffer | 18% | Extra household buffer | My judgement |
| Informal living buffer | 22% | Higher uncertainty buffer | My judgement |
| Personal rate band | 10.5–16.5% | Prototype product range | My judgement |
| Business rate band | 11.5–19.0% | Prototype product range | My judgement |
| LAP rate band | 9.5–13.5% | Secured route prototype range | My judgement |
| Vehicle rate band | 9.5–15.5% | Prototype vehicle range | My judgement |
| Home rate band | 8.0–10.5% | Prototype home range | My judgement |
| Unknown credit adjustment | +1.5 points | Unknown must widen, never become a fabricated score | My judgement / challenge principle |
| 780+ credit adjustment | -1.2 points | Strong credit evidence | My judgement |
| 750–779 adjustment | -0.7 points | Strong credit evidence | My judgement |
| 700–749 adjustment | +0.2 points | Near-neutral | My judgement |
| 650–699 adjustment | +1.5 points | Higher pricing risk | My judgement |
| <650 adjustment | +3.0 points | Higher pricing risk | My judgement |
| Recent EMI bounce | +2.5 rate points + 30% safe-EMI buffer | Recent repayment problem | My judgement |
| High card utilisation | 80%+ triggers 15% safe-EMI buffer | High revolving debt pressure | My judgement |
| Emergency savings below 3 months | 10% safe-EMI buffer | Thin cash resilience | My judgement |
| Severe existing EMI burden | Existing EMI ≥50% of underwriting income | Can trigger Don't borrow when combined with other distress | My judgement |
| Stress income shock | -20% | Simple borrower-understandable downside case | My judgement |
| LAP collateral LTV | 60% | Illustrative secured-product ceiling | My judgement |
| Secured lender-style uplift | 35% | Collateral can improve secured lender-style headroom, but the uplift remains tied to income-based capacity and is capped by LTV | My judgement |
| Vehicle cap | 90% of requested amount | Prototype product constraint | My judgement |
| Personal processing fee | 2% | Used in APR estimate | My judgement |
| Business processing fee | 2% | Prototype assumption | My judgement |
| LAP processing fee | 1% | Prototype assumption | My judgement |
| Vehicle processing fee | 1.5% | Prototype assumption | My judgement |
| Home processing fee | 0.5% | Prototype assumption | My judgement |

## Credit-score integrity

The original user-entered credit score is stored once in `answers.creditScore` and displayed from that same value. A separate local numeric conversion is used only inside the rules engine to choose the documented pricing band.

Example: entering **735** displays **735**. The calculation may classify 735 into the 700–749 band, but the UI never displays 740 as the user's score.

## Calculation pipeline

1. **Normalize inputs** only for calculation. Preserve original displayed answers.
2. **Underwriting income:** for self-employed borrowers, use the lower of stated monthly income and monthly ITR income when ITR is supplied.
3. **Estimated lender-style EMI capacity:** `(underwriting income × FOIR) − existing EMIs`.
4. **Estimated lender-style amount:** convert that EMI capacity to a loan amount using midpoint rate + selected tenure. For a LAP route with collateral, apply a modest 35% secured headroom uplift to the income-based lender amount, capped by the illustrative 60% LTV ceiling.
5. **Borrower cash-flow EMI capacity:** `(income − household expenses − existing EMIs) × (1 − living buffer)`.
6. **Safe EMI:** lower of lender-style EMI capacity and household cash-flow capacity, then documented risk buffers are applied.
7. **Safe amount:** convert safe EMI to loan principal at midpoint rate + tenure.
8. **Collateral:** shown separately as available collateral and, where relevant, an illustrative LTV ceiling. It never increases safe EMI.
9. **Productive borrowing:** expected additional monthly profit is compared with proposed EMI. If expected profit does not cover the proposed EMI and the stress case also fails, this can contribute to a Don't borrow decision. It never increases safe EMI.
10. **Stress:** income drops 20%; expenses and existing EMI remain constant. Recalculate EMI capacity.

## Verdict hierarchy

### Don't borrow
Safe amount is set to **₹0** when a severe documented distress rule fires. This prevents the contradictory combination of a red Don't borrow verdict and a non-zero "safe" amount.

Severe distress can be triggered by combinations including:

- no monthly cash remaining after essentials and existing EMIs;
- recent bounce plus high existing EMI burden, high-cost debt, or informal/variable income;
- very high existing EMI burden combined with high card utilisation or only one month of emergency savings;
- productive borrowing where expected additional profit is below proposed EMI and the stress case also fails.

### Borrow less
Requested amount is above the safe amount but no severe distress rule fires.

### Borrow
Requested amount is within the safe amount and there is no severe distress signal.

## Adaptive questions

- Self-employed → ITR income and collateral.
- Productive borrowing → expected additional monthly profit.
- Existing debt → approximate interest rate.
- Credit → exact score (optional), utilisation (optional), bounces.
- Income → stability.
- Personal consumption → optional upcoming major expense.

Questions are included because their answers can change a calculation, route, confidence, or explanation.

## APR estimate

The UI calls this an **estimated first-year APR**. Prototype formula:

`APR estimate = (first-year interest + assumed processing fee) / principal × 100`

This is intentionally not presented as a complete legal APR calculation because lender-specific fees, timing, insurance and other charges are unknown.

## What the app does not know

No bureau pull, bank statements, employer verification, lender-specific credit policy, exact lender fees, legal collateral checks, full credit history, or verified future income is available. Therefore the app uses ranges, confidence labels and explicit assumptions.

## Household income and repayment path
- Borrower income remains the basis for the illustrative lender-style FOIR calculation.
- Regular other household income can be counted in borrower-safe household cash-flow affordability, but is shown separately so it is not confused with lender underwriting income.
- Existing debt is captured as individual loans with EMI and months remaining. Current total EMI is the sum of active loans.
- Future EMI relief is visible, but current affordability remains the primary gate: the app does not assume an EMI has disappeared before its stated end month.
- Productive-return shortfall is a reason to reduce the requested amount, not an automatic reason to set safe borrowing to zero.
- Borrowers enter their preferred tenure as a number of whole years rather than choosing from a fixed dropdown, so a valid value such as 6 years is supported. The app validates it against the product-specific maximum tenure.
- If the requested amount can fit the safe EMI only by extending tenure, the result suggests the shortest available whole-year tenure that does so. If no available tenure works, the app recommends reducing the amount.
