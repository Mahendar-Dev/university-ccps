// riskEngine.js
// A transparent, rule-based real-time fraud scoring engine for bank loan applications.
// Every rule that fires is returned so officers can see *why* a score was assigned.

export const DUPLICATE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const VELOCITY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const NEW_ACCOUNT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

function msAgo(timestamp) {
  return Date.now() - timestamp;
}

/**
 * @param {object} draft - { purpose, loanAmount, accountId, agentId }
 * @param {object} account - { creditLimit, kycExpiryDate, createdAt }
 * @param {object[]} existingApplications - applications to check duplicates/velocity against
 */
export function scoreLoanApplication(draft, account, existingApplications) {
  let score = 0;
  const triggeredRules = [];

  const { purpose, loanAmount, accountId, agentId } = draft;

  // --- Rule 1: KYC/account expired at time of application ---
  if (account.kycExpiryDate <= Date.now()) {
    score += 40;
    triggeredRules.push("Applicant's KYC/account verification was expired at the time of application");
  }

  // --- Rule 2: loan exceeds pre-approved credit limit entirely ---
  if (loanAmount > account.creditLimit) {
    score += 35;
    triggeredRules.push("Loan amount exceeds the applicant's pre-approved credit limit");
  } else if (loanAmount > account.creditLimit * 0.7) {
    // --- Rule 3: loan is close to the credit limit (but not over) ---
    score += 15;
    triggeredRules.push("Loan amount is unusually close to the pre-approved credit limit");
  }

  // --- Rule 4: duplicate purpose loan on the same account within the window ---
  const duplicate = existingApplications.some(
    (a) =>
      a.accountId === accountId &&
      a.purpose.trim().toLowerCase() === purpose.trim().toLowerCase() &&
      msAgo(a.submittedAt) <= DUPLICATE_WINDOW_MS
  );
  if (duplicate) {
    score += 30;
    triggeredRules.push("Same loan purpose applied for on this account within the last 7 days");
  }

  // --- Rule 5: application velocity - same bank agent submitting many applications quickly ---
  const agentVelocity = existingApplications.filter(
    (a) => a.agentId === agentId && msAgo(a.submittedAt) <= VELOCITY_WINDOW_MS
  ).length;
  if (agentVelocity >= 3) {
    score += 20;
    triggeredRules.push(
      `Unusually high application volume from this agent (${agentVelocity + 1} in 10 minutes)`
    );
  }

  // --- Rule 6: suspiciously round, large amount ---
  if (loanAmount >= 5000 && loanAmount % 1000 === 0) {
    score += 10;
    triggeredRules.push("Suspiciously round loan amount");
  }

  // --- Rule 7: high-value loan shortly after account activation ---
  if (
    account.createdAt &&
    msAgo(account.createdAt) <= NEW_ACCOUNT_WINDOW_MS &&
    loanAmount > account.creditLimit * 0.5
  ) {
    score += 25;
    triggeredRules.push("High-value loan applied for shortly after account activation");
  }

  score = Math.min(score, 100);

  let level = "Low";
  if (score >= 60) level = "High";
  else if (score >= 30) level = "Medium";

  return { score, level, triggeredRules };
}
