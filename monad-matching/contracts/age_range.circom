pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";

/*
 * AgeRange: 나이대(10대/20대/30대 등) 증명
 *
 * Private input: birthYear, birthMonth
 * Public input:  currentYear, currentMonth, ageRangeMin, ageRangeMax
 * Output:        inRange (1이면 해당 나이대, 0이면 아님)
 *
 * 예: ageRangeMin=20, ageRangeMax=29 → "나는 20대다" 증명
 */
template AgeRange() {
    signal input birthYear;     // private
    signal input birthMonth;    // private
    signal input currentYear;   // public
    signal input currentMonth;  // public
    signal input ageRangeMin;   // public (예: 20)
    signal input ageRangeMax;   // public (예: 29)
    signal output inRange;

    // 만 나이 계산 (월 기반)
    signal yearDiff;
    yearDiff <== currentYear - birthYear;

    signal totalMonthsLived;
    totalMonthsLived <== yearDiff * 12 + currentMonth;

    // 최솟값 이상: totalMonthsLived >= birthMonth + ageRangeMin * 12
    signal minThreshold;
    minThreshold <== birthMonth + ageRangeMin * 12;

    component geMin = GreaterEqThan(14);
    geMin.in[0] <== totalMonthsLived;
    geMin.in[1] <== minThreshold;

    // 최댓값 이하: totalMonthsLived < birthMonth + (ageRangeMax + 1) * 12
    signal maxThreshold;
    maxThreshold <== birthMonth + (ageRangeMax + 1) * 12;

    component ltMax = LessThan(14);
    ltMax.in[0] <== totalMonthsLived;
    ltMax.in[1] <== maxThreshold;

    // 둘 다 만족해야 inRange = 1
    inRange <== geMin.out * ltMax.out;
}

component main {public [currentYear, currentMonth, ageRangeMin, ageRangeMax]} = AgeRange();
