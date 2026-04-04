pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";

/*
 * AgeCheck: 만 19세 이상인지 증명
 *
 * Private input: birthYear, birthMonth (사용자만 앎)
 * Public input:  currentYear, currentMonth (체인 시각 — verifier에서 고정)
 * Output:        isAdult (1이면 성인, 0이면 미성년)
 *
 * 실제 생년월일은 절대 공개되지 않음.
 */
template AgeCheck() {
    signal input birthYear;    // private
    signal input birthMonth;   // private
    signal input currentYear;  // public
    signal input currentMonth; // public
    signal output isAdult;

    // birthYear, birthMonth 범위 제한 (회로 건전성)
    // birthYear: 1900 ~ 2099, birthMonth: 1 ~ 12
    component yearGe = GreaterEqThan(12);
    yearGe.in[0] <== birthYear;
    yearGe.in[1] <== 1900;

    component yearLe = LessEqThan(12);
    yearLe.in[0] <== birthYear;
    yearLe.in[1] <== 2099;

    component monthGe = GreaterEqThan(4);
    monthGe.in[0] <== birthMonth;
    monthGe.in[1] <== 1;

    component monthLe = LessEqThan(4);
    monthLe.in[0] <== birthMonth;
    monthLe.in[1] <== 12;

    // 연 차이
    signal yearDiff;
    yearDiff <== currentYear - birthYear;

    // 월이 지났는지 (currentMonth >= birthMonth → 1, else 0)
    component monthPassed = GreaterEqThan(4);
    monthPassed.in[0] <== currentMonth;
    monthPassed.in[1] <== birthMonth;

    // 만 나이 = yearDiff - (월 안 지났으면 1)
    // 만 19세 이상: yearDiff > 19 OR (yearDiff == 19 AND monthPassed)
    // 단순화: yearDiff * 12 + currentMonth >= birthMonth + 19*12

    signal totalMonthsLived;
    totalMonthsLived <== yearDiff * 12 + currentMonth;

    signal adultThresholdMonths;
    adultThresholdMonths <== birthMonth + 19 * 12;

    component ageCheck = GreaterEqThan(14); // 14비트면 0~16383 충분
    ageCheck.in[0] <== totalMonthsLived;
    ageCheck.in[1] <== adultThresholdMonths;

    isAdult <== ageCheck.out;
}

component main {public [currentYear, currentMonth]} = AgeCheck();
