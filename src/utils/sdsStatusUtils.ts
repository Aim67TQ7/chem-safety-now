
export interface SDSStatusInfo {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  statusLabel: string;
  confidence: number;
  isEvaluated: boolean;
}

export const getSDSDocumentStatus = (document: any): SDSStatusInfo => {
  const status = document.extraction_status || 'pending';
  const confidence = document.ai_extraction_confidence || 0;
  const qualityScore = document.extraction_quality_score || 0;

  // OSHA Compliant (Green)
  if (status === 'osha_compliant' && confidence >= 98) {
    return {
      backgroundColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900',
      statusLabel: 'OSHA Compliant',
      confidence,
      isEvaluated: true
    };
  }

  // Manual Review Required (Orange)
  if (status === 'manual_review_required') {
    return {
      backgroundColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      textColor: 'text-orange-900',
      statusLabel: 'Manual Review Required',
      confidence,
      isEvaluated: true
    };
  }

  // AI Enhanced / High Confidence (Blue)
  if (status === 'ai_enhanced' || confidence >= 80) {
    return {
      backgroundColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      statusLabel: `AI Enhanced (${confidence}%)`,
      confidence,
      isEvaluated: true
    };
  }

  // Low Confidence (Light Blue)
  if (confidence > 0 && confidence < 80) {
    return {
      backgroundColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      textColor: 'text-slate-900',
      statusLabel: `Low Confidence (${confidence}%)`,
      confidence,
      isEvaluated: true
    };
  }

  // Not Evaluated (Gray)
  return {
    backgroundColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-900',
    statusLabel: 'Not Evaluated',
    confidence: 0,
    isEvaluated: false
  };
};

export const getComplianceStatusBadge = (document: any) => {
  const status = document.extraction_status || 'pending';
  const confidence = document.ai_extraction_confidence || 0;

  if (status === 'osha_compliant' && confidence >= 98) {
    return {
      variant: 'default' as const,
      className: 'bg-green-600 text-white',
      label: 'OSHA Compliant',
      icon: 'Shield'
    };
  }

  if (status === 'manual_review_required') {
    return {
      variant: 'default' as const,
      className: 'bg-orange-600 text-white',
      label: 'Manual Review',
      icon: 'AlertTriangle'
    };
  }

  if (confidence >= 80) {
    return {
      variant: 'default' as const,
      className: 'bg-blue-600 text-white',
      label: 'AI Enhanced',
      icon: 'CheckCircle'
    };
  }

  if (confidence > 0) {
    return {
      variant: 'outline' as const,
      className: 'bg-slate-100 text-slate-700',
      label: `${confidence}% Quality`,
      icon: 'AlertCircle'
    };
  }

  return {
    variant: 'outline' as const,
    className: 'bg-gray-100 text-gray-600',
    label: 'Not Evaluated',
    icon: 'FileText'
  };
};
