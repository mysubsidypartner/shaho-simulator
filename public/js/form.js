/**
 * マルチステップフォーム制御・バリデーション・送信
 */

const CONFIG = {
  GAS_ENDPOINT: (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.GAS_ENDPOINT) || '',
  TOTAL_STEPS: 5,
};

const state = {
  step: 1,
  location: '',
  bonusCount: 1,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function normalizeNumber(value) {
  if (value == null || value === '') return 0;
  const normalized = String(value)
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/,/g, '')
    .trim();
  const num = Number(normalized);
  return Number.isFinite(num) ? num : NaN;
}

function formatYen(amount) {
  return `${Number(amount).toLocaleString('ja-JP')}円`;
}

function initDateSelects() {
  const yearSel = $('#birth-year');
  const monthSel = $('#birth-month');
  const daySel = $('#birth-day');
  const fiscalSel = $('#fiscal-month');

  yearSel.innerHTML = '<option value="">年</option>';
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 80; y--) {
    yearSel.innerHTML += `<option value="${y}">${y}年</option>`;
  }

  monthSel.innerHTML = '<option value="">月</option>';
  for (let m = 1; m <= 12; m++) {
    monthSel.innerHTML += `<option value="${m}">${m}月</option>`;
  }

  daySel.innerHTML = '<option value="">日</option>';
  for (let d = 1; d <= 31; d++) {
    daySel.innerHTML += `<option value="${d}">${d}日</option>`;
  }

  for (let m = 1; m <= 12; m++) {
    fiscalSel.innerHTML += `<option value="${m}">${m}月</option>`;
  }
}

function parseManSen(manValue, senValue) {
  const man = normalizeNumber(manValue);
  const sen = senValue === '' || senValue == null ? 0 : normalizeNumber(senValue);
  if (!Number.isFinite(man) || man < 0) return NaN;
  if (!Number.isFinite(sen) || sen < 0) return NaN;
  return man * 10000 + sen * 1000;
}

function parseMan(manValue) {
  const man = normalizeNumber(manValue);
  if (!Number.isFinite(man) || man < 0) return NaN;
  return man * 10000;
}

function updateBonusFields(count) {
  for (let i = 1; i <= 3; i += 1) {
    const row = document.querySelector(`label[for="bonus-${i}"]`);
    const input = $(`#bonus-${i}`);
    if (!row || !input) continue;
    const active = count > 0 && i <= count;
    row.classList.toggle('is-disabled', !active);
    input.disabled = !active;
    if (!active) input.value = '';
  }
}

function selectBonusCount(value) {
  state.bonusCount = Number(value);
  $$('#bonus-count-options .bonus-count-btn').forEach((b) => {
    b.classList.toggle('is-selected', Number(b.dataset.value) === state.bonusCount);
  });
  $('#bonus-count').value = String(state.bonusCount);
  updateBonusFields(state.bonusCount);
}

function initBonusCountButtons() {
  const container = $('#bonus-count-options');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.bonus-count-btn');
    if (!btn || !container.contains(btn)) return;
    selectBonusCount(btn.dataset.value);
  });

  selectBonusCount(state.bonusCount);
}

function initLocationButtons() {
  $$('#location-options .option-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('#location-options .option-btn').forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      state.location = btn.dataset.value;
      $('#location').value = state.location;
      $('#error-location').textContent = '';
    });
  });
}

function updateProgress() {
  const pct = Math.round((state.step / CONFIG.TOTAL_STEPS) * 100);
  $('#progress-step').textContent = `STEP ${state.step}/${CONFIG.TOTAL_STEPS}`;
  $('#progress-pct').textContent = `${pct}%`;
  $('#progress-fill').style.width = `${pct}%`;
}

function showStep(step) {
  state.step = step;
  $$('.step').forEach((el) => {
    el.classList.toggle('is-active', Number(el.dataset.step) === step);
  });
  $('#btn-back').style.visibility = step === 1 ? 'hidden' : 'visible';
  $('#btn-next').classList.toggle('is-hidden', step === CONFIG.TOTAL_STEPS);
  $('#btn-submit').classList.toggle('is-hidden', step !== CONFIG.TOTAL_STEPS);
  updateProgress();
}

function clearErrors() {
  $$('.field__error').forEach((el) => {
    el.textContent = '';
  });
}

function validateStep(step) {
  clearErrors();
  let valid = true;

  if (step === 1) {
    if (!state.location) {
      $('#error-location').textContent = '所在地を選択してください';
      valid = false;
    }
  }

  if (step === 2) {
    const y = $('#birth-year').value;
    const m = $('#birth-month').value;
    const d = $('#birth-day').value;
    if (!y || !m || !d) {
      $('#error-birth').textContent = '生年月日を選択してください';
      valid = false;
    } else {
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      if (
        date.getFullYear() !== Number(y) ||
        date.getMonth() !== Number(m) - 1 ||
        date.getDate() !== Number(d)
      ) {
        $('#error-birth').textContent = '正しい日付を選択してください';
        valid = false;
      }
    }
  }

  if (step === 3) {
    if (!$('#fiscal-month').value) {
      $('#error-fiscal').textContent = '決算月を選択してください';
      valid = false;
    }
  }

  if (step === 4) {
    const monthly = parseManSen($('#monthly-man').value, $('#monthly-sen').value);
    const manFilled = $('#monthly-man').value.trim() !== '';
    const senFilled = $('#monthly-sen').value.trim() !== '';

    if (!manFilled && !senFilled) {
      $('#error-monthly').textContent = '月収を入力してください';
      valid = false;
    } else if (!Number.isFinite(monthly) || monthly <= 0) {
      $('#error-monthly').textContent = '正しい金額を入力してください';
      valid = false;
    }

    if (state.bonusCount > 0) {
      let bonusValid = true;
      for (let i = 1; i <= state.bonusCount; i += 1) {
        const amount = parseMan($(`#bonus-${i}`).value);
        if (!Number.isFinite(amount) || amount < 0) {
          bonusValid = false;
          break;
        }
      }
      if (!bonusValid) {
        $('#error-bonus').textContent = '賞与の金額を入力してください';
        valid = false;
      }
    }
  }

  if (step === 5) {
    if (!$('#company-name').value.trim()) {
      $('#error-company').textContent = '会社名を入力してください';
      valid = false;
    }
    if (!$('#person-name').value.trim()) {
      $('#error-name').textContent = 'お名前を入力してください';
      valid = false;
    }
  }

  return valid;
}

function collectBonusPayments() {
  const payments = [];
  const limit = state.bonusCount > 0 ? state.bonusCount : 3;
  for (let i = 1; i <= limit; i += 1) {
    const input = $(`#bonus-${i}`);
    if (!input || input.disabled) continue;
    const value = input.value;
    if (!value.trim()) continue;
    const amount = parseMan(value);
    if (Number.isFinite(amount) && amount > 0) payments.push(amount);
  }
  return payments;
}

function collectFormData() {
  const bonusPayments = collectBonusPayments();
  let bonusCount = state.bonusCount;
  if (bonusCount <= 0 && bonusPayments.length > 0) {
    bonusCount = bonusPayments.length;
  }
  return {
    location: state.location,
    birthYear: Number($('#birth-year').value),
    birthMonth: Number($('#birth-month').value),
    birthDay: Number($('#birth-day').value),
    fiscalMonth: Number($('#fiscal-month').value),
    monthlyPay: parseManSen($('#monthly-man').value, $('#monthly-sen').value),
    bonusPayments,
    annualBonus: bonusPayments.reduce((sum, n) => sum + n, 0),
    bonusCount,
    companyName: $('#company-name').value.trim(),
    personName: $('#person-name').value.trim(),
  };
}

function showResults(simulation) {
  $('#form-container').classList.add('is-hidden');
  $('#results').classList.add('is-visible');

  $('#result-savings').textContent = simulation.savings.toLocaleString('ja-JP');
  $('#current-monthly').textContent = formatYen(simulation.monthlyPay);
  $('#current-bonus').textContent = formatYen(simulation.annualBonus);
  $('#current-total').textContent = formatYen(simulation.current.totalFull);
  $('#opt-monthly').textContent = formatYen(simulation.optimized.monthlyPay);
  $('#opt-bonus').textContent = formatYen(simulation.optimized.annualBonus);
  $('#opt-total').textContent = formatYen(simulation.optimized.totalFull);
  $('#breakdown-health-label').textContent = simulation.withCare
    ? '健康保険料（介護保険料含む）'
    : '健康保険料';
  $('#breakdown-health').textContent = formatYen(simulation.optimized.breakdown.healthInsurance);
  $('#breakdown-child').textContent = formatYen(simulation.optimized.breakdown.childSupport);
  $('#breakdown-pension').textContent = formatYen(simulation.optimized.breakdown.pension);
  $('#breakdown-half').textContent = formatYen(simulation.optimized.totalHalf);

  const careLabel = simulation.withCare ? '（介護保険料あり）' : '（介護保険料なし）';
  const bonusLabel =
    simulation.bonusCount > 0
      ? `賞与${simulation.bonusCount}回払い`
      : '賞与なし';
  $('#result-meta').textContent =
    `${simulation.location} / ${simulation.ageCategory}${careLabel} / 年齢 ${simulation.age}歳 / ${bonusLabel} / 令和8年度料率`;
}

function submitToGas(formData, simulation) {
  if (!CONFIG.GAS_ENDPOINT) return;

  const payload = {
    location: formData.location,
    birthDate: simulation.birthDate,
    ageCategory: simulation.ageCategory,
    fiscalMonth: formData.fiscalMonth,
    monthlyPay: formData.monthlyPay,
    annualBonus: formData.annualBonus,
    bonusCount: formData.bonusCount,
    bonusPayments: JSON.stringify(formData.bonusPayments),
    annualRemuneration: simulation.annualRemuneration,
    companyName: formData.companyName,
    personName: formData.personName,
    resultTotal: simulation.current.totalFull,
    resultOptimizedTotal: simulation.optimized.totalFull,
    resultSavings: simulation.savings,
    optimizedMonthlyPay: simulation.optimized.monthlyPay,
    optimizedAnnualBonus: simulation.optimized.annualBonus,
    resultBreakdown: JSON.stringify(simulation.optimized.breakdown),
  };

  fetch(CONFIG.GAS_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {
    // fire-and-forget: 蓄積失敗でも結果表示は継続
  });
}

function resetForm() {
  $('#sim-form').reset();
  state.location = '';
  state.bonusCount = 1;
  selectBonusCount(1);
  state.step = 1;
  $$('#location-options .option-btn').forEach((b) => b.classList.remove('is-selected'));
  clearErrors();
  $('#results').classList.remove('is-visible');
  $('#start-screen').classList.remove('is-hidden');
  $('#form-container').classList.add('is-hidden');
}

function bindEvents() {
  $('#btn-start').addEventListener('click', () => {
    $('#start-screen').classList.add('is-hidden');
    $('#form-container').classList.remove('is-hidden');
    showStep(1);
  });

  $('#btn-back').addEventListener('click', () => {
    if (state.step > 1) showStep(state.step - 1);
  });

  $('#btn-next').addEventListener('click', () => {
    if (validateStep(state.step)) {
      showStep(state.step + 1);
    }
  });

  $('#sim-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateStep(CONFIG.TOTAL_STEPS)) return;

    const formData = collectFormData();
    const simulation = runSimulation(formData);
    showResults(simulation);
    submitToGas(formData, simulation);
  });

  $('#btn-retry').addEventListener('click', resetForm);
}

document.addEventListener('DOMContentLoaded', () => {
  initDateSelects();
  initLocationButtons();
  initBonusCountButtons();
  bindEvents();
});
