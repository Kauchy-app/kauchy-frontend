/**
 * Format a number (or numeric string) as Nigerian Naira with thousands separators.
 *
 * Examples:
 *   formatNaira(1500)      → "₦1,500"
 *   formatNaira(1500.5)    → "₦1,500.50"
 *   formatNaira("2500")    → "₦2,500"
 *   formatNaira(0)         → "₦0"
 */
export function formatNaira(amount: number | string): string {
    const num = Number(amount) || 0;

    // If the value has meaningful decimals, keep two decimal places;
    // otherwise show a whole number so prices like ₦1,500 stay clean.
    const hasDecimals = num % 1 !== 0;

    return `₦${num.toLocaleString('en-NG', {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
    })}`;
}

/**
 * Same as formatNaira but always shows 2 decimal places.
 * Useful for wallet balances, totals, and transaction amounts.
 *
 * Examples:
 *   formatNairaFixed(1500)   → "₦1,500.00"
 *   formatNairaFixed(0)      → "₦0.00"
 */
export function formatNairaFixed(amount: number | string): string {
    const num = Number(amount) || 0;
    return `₦${num.toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}
