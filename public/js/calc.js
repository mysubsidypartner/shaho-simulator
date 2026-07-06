/**
 * 社会保険料計算（Excel ロジック踏襲）
 * 純粋関数として実装。フロント / GAS 双方から利用可能。
 */

const BONUS_HEALTH_CAP_ANNUAL = 5730000;
const BONUS_PENSION_CAP_PER_PAYMENT = 1500000;
const MIN_MONTHLY_PAY = 58000;
function isNumericPremium(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function getPensionGrades(grades) {
  return grades.filter((g) => isNumericPremium(g.pensionFull));
}

function roundDownThousands(value) {
  return Math.floor(value / 1000) * 1000;
}

function lookupGrade(monthlyPay, grades) {
  const pay = Number(monthlyPay);
  let matched = null;
  for (const grade of grades) {
    if (pay >= grade.minPay && pay <= grade.maxPay) {
      matched = grade;
      break;
    }
  }
  if (!matched) {
    const candidates = grades.filter((g) => pay >= g.minPay);
    matched = candidates.length ? candidates[candidates.length - 1] : grades[0];
  }
  return matched;
}

function getStandardMonthlyCandidates(table, minMonthly, maxMonthly) {
  const seen = new Set();
  const candidates = [];
  for (const grade of table.grades) {
    const m = grade.standardMonthly;
    if (!m || m < minMonthly || m > maxMonthly || seen.has(m)) continue;
    seen.add(m);
    candidates.push(m);
  }
  return candidates.sort((a, b) => a - b);
}

function splitBonusPayments(totalBonus, count) {
  const n = Math.max(1, Math.min(4, count));
  const total = Number(totalBonus) || 0;
  if (total <= 0) return [];
  const base = Math.floor(total / n);
  const payments = Array(n).fill(base);
  payments[0] += total - base * n;
  return payments;
}

function lookupPensionGrade(monthlyPay, grades) {
  const pensionGrades = getPensionGrades(grades);
  if (!pensionGrades.length) {
    throw new Error('厚生年金の等級表が見つかりません');
  }
  return lookupGrade(monthlyPay, pensionGrades);
}

function getMonthlyPremiums(monthlyPay, table, withCare) {
  const grade = lookupGrade(monthlyPay, table.grades);
  const pensionGrade = lookupPensionGrade(monthlyPay, table.grades);

  return {
    grade: grade.grade,
    standardMonthly: grade.standardMonthly,
    healthFull: grade.healthFull,
    healthHalf: grade.healthHalf,
    childFull: grade.childFull,
    childHalf: grade.childHalf,
    pensionFull: pensionGrade.pensionFull,
    pensionHalf: isNumericPremium(pensionGrade.pensionHalf)
      ? pensionGrade.pensionHalf
      : pensionGrade.pensionFull / 2,
    withCare,
  };
}

function calculateBonusPremiums(bonusPayments, rates) {
  let usedHealthBase = 0;
  let healthFull = 0;
  let childFull = 0;
  let pensionFull = 0;
  const details = [];

  for (const raw of bonusPayments) {
    const amount = Number(raw) || 0;
    if (amount <= 0) continue;

    const rounded = roundDownThousands(amount);
    const healthBase = Math.max(0, Math.min(rounded, BONUS_HEALTH_CAP_ANNUAL - usedHealthBase));
    const pensionBase = Math.min(rounded, BONUS_PENSION_CAP_PER_PAYMENT);
    usedHealthBase += healthBase;

    const row = {
      rawAmount: amount,
      healthBase,
      pensionBase,
      healthFull: healthBase * rates.health,
      childFull: healthBase * rates.child,
      pensionFull: pensionBase * rates.pension,
    };
    healthFull += row.healthFull;
    childFull += row.childFull;
    pensionFull += row.pensionFull;
    details.push(row);
  }

  return { healthFull, childFull, pensionFull, details };
}

function sumPremiums(monthly, bonus) {
  return {
    healthFull: monthly.healthFull + bonus.healthFull,
    childFull: monthly.childFull + bonus.childFull,
    pensionFull: monthly.pensionFull + bonus.pensionFull,
    healthHalf: (monthly.healthFull + bonus.healthFull) / 2,
    childHalf: (monthly.childFull + bonus.childFull) / 2,
    pensionHalf: (monthly.pensionFull + bonus.pensionFull) / 2,
  };
}

/**
 * @param {object} input
 * @param {number} input.monthlyPay - 月額報酬
 * @param {number[]} input.bonusPayments - 賞与支給額（複数回可）
 * @param {object} table - getRateTable() の戻り値
 * @param {boolean} withCare - 介護保険第2号被保険者
 */
function calculate(input, table, withCare) {
  const monthlyPay = Number(input.monthlyPay) || 0;
  const bonusPayments = (input.bonusPayments || []).map(Number).filter((n) => n > 0);
  const rates = table.rates;

  const monthlyGrade = getMonthlyPremiums(monthlyPay, table, withCare);
  const monthly = {
    healthFull: monthlyGrade.healthFull,
    childFull: monthlyGrade.childFull,
    pensionFull: monthlyGrade.pensionFull,
  };

  const bonus = calculateBonusPremiums(bonusPayments, rates);
  const annualMonthly = {
    healthFull: monthly.healthFull * 12,
    childFull: monthly.childFull * 12,
    pensionFull: monthly.pensionFull * 12,
  };

  const annualBonusPremiums = {
    healthFull: bonus.healthFull,
    childFull: bonus.childFull,
    pensionFull: bonus.pensionFull,
  };

  const annualTotal = {
    healthFull: annualMonthly.healthFull + annualBonusPremiums.healthFull,
    childFull: annualMonthly.childFull + annualBonusPremiums.childFull,
    pensionFull: annualMonthly.pensionFull + annualBonusPremiums.pensionFull,
  };

  const totalFull =
    annualTotal.healthFull + annualTotal.childFull + annualTotal.pensionFull;
  const totalHalf = totalFull / 2;

  return {
    monthlyPay,
    bonusPayments,
    annualRemuneration: monthlyPay * 12 + bonusPayments.reduce((a, b) => a + b, 0),
    grade: monthlyGrade.grade,
    standardMonthly: monthlyGrade.standardMonthly,
    withCare,
    monthly: {
      ...monthly,
      healthHalf: monthly.healthFull / 2,
      childHalf: monthly.childFull / 2,
      pensionHalf: isNumericPremium(monthly.pensionFull) ? Math.round(monthly.pensionFull / 2) : 0,
    },
    bonus,
    annualMonthly,
    annualBonusPremiums,
    annualTotal,
    totalFull: Math.round(totalFull),
    totalHalf: Math.round(totalHalf),
    breakdown: {
      healthInsurance: Math.round(annualTotal.healthFull),
      childSupport: Math.round(annualTotal.childFull),
      pension: Math.round(annualTotal.pensionFull),
      healthInsuranceHalf: Math.round(annualTotal.healthFull / 2),
      childSupportHalf: Math.round(annualTotal.childFull / 2),
      pensionHalf: Math.round(annualTotal.pensionHalf / 2),
    },
  };
}

function getAge(birthDate, referenceDate = new Date()) {
  const birth = new Date(birthDate);
  const ref = new Date(referenceDate);
  let age = ref.getFullYear() - birth.getFullYear();
  const m = ref.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < birth.getDate())) age -= 1;
  return age;
}

function getAgeCategory(birthDate, referenceDate = new Date()) {
  return getAge(birthDate, referenceDate) >= 40 ? '40歳以上' : '40歳未満';
}

function optimizeCompensation({ monthlyPay, annualBonus, table, withCare }) {
  const annualTotal = monthlyPay * 12 + annualBonus;
  const reductionTarget = Math.max(MIN_MONTHLY_PAY, monthlyPay - 100000);
  const floorGrade = lookupGrade(reductionTarget, table.grades);
  const floorMonthly = floorGrade.standardMonthly;

  const candidates = getStandardMonthlyCandidates(table, floorMonthly, monthlyPay);
  if (!candidates.length) {
    const result = calculate(
      { monthlyPay, bonusPayments: annualBonus > 0 ? [annualBonus] : [] },
      table,
      withCare
    );
    return { monthlyPay, annualBonus, bonusPayments: result.bonusPayments, result };
  }

  let best = null;
  for (const m of candidates) {
    const bonus = annualTotal - m * 12;
    if (bonus < 0) continue;

    for (let splitCount = 1; splitCount <= 3; splitCount += 1) {
      const bonusPayments = splitBonusPayments(bonus, splitCount);
      const result = calculate({ monthlyPay: m, bonusPayments }, table, withCare);
      if (!best || result.totalFull < best.result.totalFull) {
        best = { monthlyPay: m, annualBonus: bonus, bonusPayments, result };
      }
    }
  }

  if (!best) {
    const result = calculate(
      { monthlyPay, bonusPayments: annualBonus > 0 ? [annualBonus] : [] },
      table,
      withCare
    );
    return { monthlyPay, annualBonus, bonusPayments: result.bonusPayments, result };
  }

  return best;
}

function normalizeBonusData({ bonusCount, bonusPayments, annualBonus }) {
  const payments = (bonusPayments || []).map(Number).filter((n) => Number.isFinite(n) && n > 0);
  let count = Number(bonusCount) || 0;
  let total = Number(annualBonus) || 0;

  if (!payments.length && total > 0) {
    count = count > 0 ? count : 1;
    const split = splitBonusPayments(total, count);
    return {
      bonusPayments: split,
      bonusCount: count,
      annualBonus: total,
    };
  }

  if (payments.length && count <= 0) {
    count = payments.length;
  }

  const sum = payments.reduce((s, n) => s + n, 0);
  return {
    bonusPayments: payments,
    bonusCount: count,
    annualBonus: sum || total,
  };
}

function runSimulation(formData, referenceDate = new Date()) {
  const birthDate = `${formData.birthYear}-${String(formData.birthMonth).padStart(2, '0')}-${String(formData.birthDay).padStart(2, '0')}`;
  const ageCategory = getAgeCategory(birthDate, referenceDate);
  const withCare = ageCategory === '40歳以上';
  const table = getRateTable(formData.location, ageCategory);

  const monthlyPay = Number(formData.monthlyPay) || 0;
  const bonus = normalizeBonusData({
    bonusCount: formData.bonusCount,
    bonusPayments: formData.bonusPayments,
    annualBonus: formData.annualBonus,
  });
  const { bonusPayments: currentBonusPayments, bonusCount, annualBonus } = bonus;

  const current = calculate(
    { monthlyPay, bonusPayments: currentBonusPayments },
    table,
    withCare
  );

  const optimized = optimizeCompensation({
    monthlyPay,
    annualBonus,
    table,
    withCare,
  });

  const savings = current.totalFull - optimized.result.totalFull;

  return {
    birthDate,
    age: getAge(birthDate, referenceDate),
    ageCategory,
    withCare,
    location: formData.location,
    fiscalMonth: formData.fiscalMonth,
    monthlyPay,
    annualBonus,
    bonusCount,
    annualRemuneration: monthlyPay * 12 + annualBonus,
    current,
    optimized: {
      ...optimized.result,
      monthlyPay: optimized.monthlyPay,
      annualBonus: optimized.annualBonus,
    },
    savings: Math.round(savings),
  };
}
