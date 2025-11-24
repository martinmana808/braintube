export const formatDuration = (isoDuration) => {
  if (!isoDuration) return '';
  
  // Parse ISO 8601 duration (PT#H#M#S)
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '';

  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '').replace('S', '');

  let result = '';
  
  if (hours) {
    result += `${hours}:`;
    result += `${minutes.padStart(2, '0')}:`;
  } else {
    result += `${minutes || '0'}:`;
  }
  
  result += seconds.padStart(2, '0');
  
  return result;
};
