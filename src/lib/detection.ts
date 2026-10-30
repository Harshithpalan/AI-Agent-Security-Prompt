export interface DetectionResult {
  isInjection: boolean;
  confidence: number;
  patterns: DetectedPattern[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DetectedPattern {
  pattern: string;
  matchedText: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  explanation: string;
}

const INJECTION_PATTERNS = [
  // Critical severity patterns
  {
    pattern: /ignore\s+(all\s+)?previous\s+(instructions|commands|prompts)/gi,
    severity: 'critical' as const,
    category: 'Instruction Override',
    explanation: 'Attempts to override or ignore previous system instructions'
  },
  {
    pattern: /forget\s+(everything|all\s+instructions|all\s+prompts)/gi,
    severity: 'critical' as const,
    category: 'Memory Clear',
    explanation: 'Attempts to clear or forget previous context and instructions'
  },
  {
    pattern: /system\s*:\s*["']?(ignore|override|bypass|disable)/gi,
    severity: 'critical' as const,
    category: 'System Manipulation',
    explanation: 'Attempts to manipulate system-level instructions'
  },
  {
    pattern: /developer\s+mode|admin\s+mode|root\s+mode/gi,
    severity: 'critical' as const,
    category: 'Privilege Escalation',
    explanation: 'Attempts to enable developer or admin privileges'
  },

  // High severity patterns
  {
    pattern: /act\s+(as|like)\s+(a|an)?\s*(developer|admin|root|system|god|supervisor)/gi,
    severity: 'high' as const,
    category: 'Role Manipulation',
    explanation: 'Attempts to adopt a privileged role'
  },
  {
    pattern: /override\s+(your\s+)?(programming|instructions|training|constraints)/gi,
    severity: 'high' as const,
    category: 'Constraint Bypass',
    explanation: 'Attempts to override system constraints or training'
  },
  {
    pattern: /new\s+(instructions|commands|rules|directives)[:\s]/gi,
    severity: 'high' as const,
    category: 'Instruction Injection',
    explanation: 'Attempts to inject new instructions'
  },
  {
    pattern: /bypass\s+(security|filters|restrictions|safety)/gi,
    severity: 'high' as const,
    category: 'Security Bypass',
    explanation: 'Attempts to bypass security measures'
  },
  {
    pattern: /jailbreak|escape\s+(the\s+)?(system|confinement|restrictions)/gi,
    severity: 'high' as const,
    category: 'Jailbreak Attempt',
    explanation: 'Attempts to escape system restrictions'
  },

  // Medium severity patterns
  {
    pattern: /pretend\s+(you\s+)?(to\s+)?be|imagine\s+(you\s+)?(are|being)/gi,
    severity: 'medium' as const,
    category: 'Persona Adoption',
    explanation: 'Attempts to adopt a different persona'
  },
  {
    pattern: /from\s+now\s+on|starting\s+now|for\s+the\s+rest\s+of\s+this\s+conversation/gi,
    severity: 'medium' as const,
    category: 'Context Shift',
    explanation: 'Attempts to shift the conversation context'
  },
  {
    pattern: /your\s+(new\s+)?(role|name|identity|personality)\s+is/gi,
    severity: 'medium' as const,
    category: 'Identity Change',
    explanation: 'Attempts to change the AI identity'
  },
  {
    pattern: /disregard\s+(the\s+)?(above|previous|earlier)/gi,
    severity: 'medium' as const,
    category: 'Disregard Context',
    explanation: 'Attempts to disregard previous context'
  },
  {
    pattern: /replace\s+(your\s+)?(response|answer|output)\s+with/gi,
    severity: 'medium' as const,
    category: 'Output Manipulation',
    explanation: 'Attempts to manipulate the expected output format'
  },

  // Low severity patterns (suspicious but could be legitimate)
  {
    pattern: /\b(API|api)\s+(key|token|secret|password|credential)/gi,
    severity: 'low' as const,
    category: 'Credential Request',
    explanation: 'Requests for sensitive credentials or tokens'
  },
  {
    pattern: /show\s+me\s+(your\s+)?(internal|hidden|secret|system)\s+(prompt|instructions|code)/gi,
    severity: 'low' as const,
    category: 'Information Disclosure',
    explanation: 'Attempts to access internal system information'
  },
  {
    pattern: /tell\s+me\s+(your\s+)?(exact|full|complete)\s+(prompt|instructions)/gi,
    severity: 'low' as const,
    category: 'Prompt Extraction',
    explanation: 'Attempts to extract the system prompt'
  },
  {
    pattern: /what\s+(are|were)\s+your\s+(initial|original|system)\s+(instructions|prompts)/gi,
    severity: 'low' as const,
    category: 'Prompt Extraction',
    explanation: 'Attempts to learn about system instructions'
  },
  {
    pattern: /print\s+(your\s+)?(entire|full|complete)\s+(prompt|system\s+message)/gi,
    severity: 'low' as const,
    category: 'Prompt Extraction',
    explanation: 'Attempts to display the system prompt'
  },

  // Encoding-based patterns
  {
    pattern: /base64:\s*[A-Za-z0-9+/=]{20,}/gi,
    severity: 'high' as const,
    category: 'Encoded Content',
    explanation: 'Contains potentially encoded instructions'
  },
  {
    pattern: /decode\s+(this|the\s+following)/gi,
    severity: 'medium' as const,
    category: 'Decoding Request',
    explanation: 'Requests to decode content, potentially revealing hidden instructions'
  },

  // JSON/Structure manipulation
  {
    pattern: /\{\s*["']?role["']?\s*:\s*["']?system["']?\s*\}/gi,
    severity: 'high' as const,
    category: 'Structure Manipulation',
    explanation: 'Attempts to manipulate message structure'
  },
  {
    pattern: /\{\s*["']?instructions["']?\s*:/gi,
    severity: 'medium' as const,
    category: 'Structure Manipulation',
    explanation: 'Contains JSON-like instruction structure'
  },

  // DAN (Do Anything Now) and similar jailbreaks
  {
    pattern: /DAN\s*[:\s]|do\s+anything\s+now/gi,
    severity: 'critical' as const,
    category: 'Known Jailbreak',
    explanation: 'Uses known DAN jailbreak pattern'
  },
  {
    pattern: /above\s+(all\s+)?guidelines|against\s+(your\s+)?(guidelines|programming)/gi,
    severity: 'high' as const,
    category: 'Guideline Violation',
    explanation: 'Attempts to violate safety guidelines'
  },
];

export function detectPromptInjection(text: string): DetectionResult {
  const detectedPatterns: DetectedPattern[] = [];
  
  for (const patternDef of INJECTION_PATTERNS) {
    const matches = text.match(patternDef.pattern);
    if (matches) {
      for (const match of matches) {
        detectedPatterns.push({
          pattern: patternDef.pattern.source,
          matchedText: match,
          severity: patternDef.severity,
          category: patternDef.category,
          explanation: patternDef.explanation
        });
      }
    }
  }

  // Remove duplicate matches
  const uniquePatterns = detectedPatterns.filter((pattern, index, self) =>
    index === self.findIndex(p => p.matchedText === pattern.matchedText)
  );

  if (uniquePatterns.length === 0) {
    return {
      isInjection: false,
      confidence: 0,
      patterns: [],
      severity: 'low'
    };
  }

  // Calculate confidence based on severity and number of patterns
  const severityWeights = { low: 1, medium: 2, high: 3, critical: 4 };
  const totalWeight = uniquePatterns.reduce((sum, p) => sum + severityWeights[p.severity], 0);
  const maxPossibleWeight = uniquePatterns.length * 4;
  const confidence = Math.min(100, Math.round((totalWeight / maxPossibleWeight) * 100));

  // Determine overall severity
  const severities = uniquePatterns.map(p => p.severity);
  const overallSeverity: 'low' | 'medium' | 'high' | 'critical' = 
    severities.includes('critical') ? 'critical' :
    severities.includes('high') ? 'high' :
    severities.includes('medium') ? 'medium' : 'low';

  return {
    isInjection: true,
    confidence,
    patterns: uniquePatterns,
    severity: overallSeverity
  };
}

export function analyzeBatch(texts: string[]): Map<string, DetectionResult> {
  const results = new Map<string, DetectionResult>();
  
  for (const text of texts) {
    results.set(text, detectPromptInjection(text));
  }
  
  return results;
}
