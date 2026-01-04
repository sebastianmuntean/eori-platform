/**
 * Email Parser Service
 * Parses email content to extract event information (weddings, baptisms, funerals)
 */

export type ParsedEventType = 'wedding' | 'baptism' | 'funeral' | null;

export interface ParsedEventData {
  type: ParsedEventType;
  eventDate: string | null;
  location: string | null;
  priestName: string | null;
  notes: string | null;
  participants: Array<{
    role: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    email?: string;
    birthDate?: string;
  }>;
}

/**
 * Parse email content to extract event information
 */
export function parseEventEmail(
  subject: string,
  textContent: string,
  htmlContent?: string
): ParsedEventData {
  const content = textContent || extractTextFromHtml(htmlContent || '');
  const lowerSubject = subject.toLowerCase();
  const lowerContent = content.toLowerCase();

  // Determine event type from subject or content
  let type: ParsedEventType = null;
  if (lowerSubject.includes('nunt') || lowerSubject.includes('căsătorie') || lowerContent.includes('nunt')) {
    type = 'wedding';
  } else if (lowerSubject.includes('botez') || lowerContent.includes('botez')) {
    type = 'baptism';
  } else if (lowerSubject.includes('înmo') || lowerSubject.includes('funeral') || lowerContent.includes('înmo')) {
    type = 'funeral';
  }

  // Extract date patterns (DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.)
  const datePatterns = [
    /\b(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})\b/g, // DD.MM.YYYY or DD/MM/YYYY
    /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g, // YYYY-MM-DD
  ];

  let eventDate: string | null = null;
  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match && match[0]) {
      const dateStr = match[0];
      // Try to parse and format as YYYY-MM-DD
      try {
        const parsed = parseDate(dateStr);
        if (parsed) {
          eventDate = parsed;
          break;
        }
      } catch (e) {
        // Continue to next pattern
      }
    }
  }

  // Extract location (look for common keywords)
  const locationKeywords = ['la', 'în', 'biserica', 'parohia', 'capela'];
  let location: string | null = null;
  for (const keyword of locationKeywords) {
    const regex = new RegExp(`\\b${keyword}\\s+([^\\n,]+)`, 'i');
    const match = content.match(regex);
    if (match && match[1]) {
      location = match[1].trim();
      break;
    }
  }

  // Extract priest name
  const priestKeywords = ['preot', 'părinte', 'pater'];
  let priestName: string | null = null;
  for (const keyword of priestKeywords) {
    const regex = new RegExp(`\\b${keyword}\\s+([A-ZĂÂÎȘȚ][a-zăâîșț]+(?:\\s+[A-ZĂÂÎȘȚ][a-zăâîșț]+)*)`, 'i');
    const match = content.match(regex);
    if (match && match[1]) {
      priestName = match[1].trim();
      break;
    }
  }

  // Extract participants (basic extraction)
  const participants = extractParticipants(content, type);

  return {
    type,
    eventDate,
    location,
    priestName,
    notes: content.substring(0, 500), // First 500 chars as notes
    participants,
  };
}

/**
 * Extract text content from HTML
 */
function extractTextFromHtml(html: string): string {
  // Simple HTML tag removal
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse date string to YYYY-MM-DD format
 */
function parseDate(dateStr: string): string | null {
  try {
    // Try DD.MM.YYYY or DD/MM/YYYY
    const parts1 = dateStr.match(/^(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})$/);
    if (parts1) {
      const day = parts1[1].padStart(2, '0');
      const month = parts1[2].padStart(2, '0');
      const year = parts1[3];
      return `${year}-${month}-${day}`;
    }

    // Try YYYY-MM-DD
    const parts2 = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (parts2) {
      const year = parts2[1];
      const month = parts2[2].padStart(2, '0');
      const day = parts2[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // Invalid date format
  }
  return null;
}

/**
 * Extract participant information from email content
 */
function extractParticipants(content: string, eventType: ParsedEventType): ParsedEventData['participants'] {
  const participants: ParsedEventData['participants'] = [];

  if (eventType === 'wedding') {
    // Extract bride and groom
    const brideMatch = content.match(/\b(mireasă|numele miresei)[:\s]+([A-ZĂÂÎȘȚ][a-zăâîșț]+(?:\s+[A-ZĂÂÎȘȚ][a-zăâîșț]+)*)/i);
    const groomMatch = content.match(/\b(mire|numele mirelui)[:\s]+([A-ZĂÂÎȘȚ][a-zăâîșț]+(?:\s+[A-ZĂÂÎȘȚ][a-zăâîșț]+)*)/i);

    if (groomMatch && groomMatch[2]) {
      const nameParts = groomMatch[2].trim().split(/\s+/);
      participants.push({
        role: 'groom',
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || undefined,
      });
    }

    if (brideMatch && brideMatch[2]) {
      const nameParts = brideMatch[2].trim().split(/\s+/);
      participants.push({
        role: 'bride',
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || undefined,
      });
    }
  } else if (eventType === 'baptism') {
    // Extract baptized child
    const baptizedMatch = content.match(/\b(copil|numele copilului)[:\s]+([A-ZĂÂÎȘȚ][a-zăâîșț]+(?:\s+[A-ZĂÂÎȘȚ][a-zăâîșț]+)*)/i);
    if (baptizedMatch && baptizedMatch[2]) {
      const nameParts = baptizedMatch[2].trim().split(/\s+/);
      participants.push({
        role: 'baptized',
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || undefined,
      });
    }
  } else if (eventType === 'funeral') {
    // Extract deceased
    const deceasedMatch = content.match(/\b(decedat|răposat|numele)[:\s]+([A-ZĂÂÎȘȚ][a-zăâîșț]+(?:\s+[A-ZĂÂÎȘȚ][a-zăâîșț]+)*)/i);
    if (deceasedMatch && deceasedMatch[2]) {
      const nameParts = deceasedMatch[2].trim().split(/\s+/);
      participants.push({
        role: 'deceased',
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || undefined,
      });
    }
  }

  // Extract phone numbers (Romanian format: 07XXXXXXXX)
  const phoneRegex = /\b0[2-9]\d{8}\b/g;
  const phones = content.match(phoneRegex);
  if (phones && phones.length > 0 && participants.length > 0) {
    participants[0].phone = phones[0];
  }

  // Extract email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = content.match(emailRegex);
  if (emails && emails.length > 0 && participants.length > 0) {
    participants[0].email = emails[0];
  }

  return participants;
}

/**
 * Check if email is likely an event request
 */
export function isEventEmail(subject: string, content: string): boolean {
  const lowerSubject = subject.toLowerCase();
  const lowerContent = content.toLowerCase();

  const eventKeywords = [
    'nunt', 'căsătorie', 'wedding',
    'botez', 'baptism',
    'înmo', 'funeral', 'înmormântare',
  ];

  return eventKeywords.some(keyword => 
    lowerSubject.includes(keyword) || lowerContent.includes(keyword)
  );
}

