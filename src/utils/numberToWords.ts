import writtenNumber from 'written-number';

export function numberToWordsTND(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Zéro dinar et zéro millime.';
  }
  
  const absAmount = Math.abs(amount);
  const fixed = absAmount.toFixed(3);
  const [dinarStr, millimeStr] = fixed.split('.');
  
  const dinars = parseInt(dinarStr, 10);
  const millimes = parseInt(millimeStr, 10);
  
  const dinarsWords = writtenNumber(dinars, { lang: 'fr' });
  
  let result = `${dinarsWords} dinar${dinars > 1 ? 's' : ''}`;
  
  if (millimes > 0) {
    const millimesWords = writtenNumber(millimes, { lang: 'fr' });
    result += ` et ${millimesWords} millime${millimes > 1 ? 's' : ''}`;
  } else {
    result += ` et zéro millime`;
  }
  
  // Capitalize first letter and append period
  const formatted = result.charAt(0).toUpperCase() + result.slice(1);
  return formatted.endsWith('.') ? formatted : `${formatted}.`;
}

