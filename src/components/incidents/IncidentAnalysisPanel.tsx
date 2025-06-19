
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Brain, AlertCircle, CheckCircle, HelpCircle, Beaker, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface IncidentAnalysisPanelProps {
  incident: any;
  relatedSDSDocuments?: any[];
  facilityData?: any;
}

type AnalysisType = 'root_cause' | 'recommendations' | 'follow_up_questions' | 'chemical_correlation';

interface AnalysisResult {
  id: string;
  type: AnalysisType;
  content: string;
  confidence: number;
  timestamp: Date;
  loading?: boolean;
}

export const IncidentAnalysisPanel: React.FC<IncidentAnalysisPanelProps> = ({
  incident,
  relatedSDSDocuments = [],
  facilityData
}) => {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [loadingAnalysis, setLoadingAnalysis] = useState<AnalysisType | null>(null);
  const { toast } = useToast();

  const analysisTypes = [
    {
      key: 'root_cause' as AnalysisType,
      title: 'Root Cause Analysis',
      description: 'Systematic investigation to identify underlying causes',
      icon: AlertCircle,
      color: 'text-red-600 bg-red-50 border-red-200'
    },
    {
      key: 'recommendations' as AnalysisType,
      title: 'Safety Recommendations',
      description: 'Actionable steps to prevent recurrence',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      key: 'follow_up_questions' as AnalysisType,
      title: 'Investigation Questions',
      description: 'Critical questions for deeper investigation',
      icon: HelpCircle,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      key: 'chemical_correlation' as AnalysisType,
      title: 'Chemical Hazard Analysis',
      description: 'Chemical-specific safety analysis',
      icon: Beaker,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      disabled: !relatedSDSDocuments.length
    }
  ];

  const generateAnalysis = async (analysisType: AnalysisType) => {
    setLoadingAnalysis(analysisType);
    
    try {
      console.log('🔍 Requesting AI analysis:', { analysisType, incidentId: incident.id });

      const { data, error } = await supabase.functions.invoke('ai-incident-analysis', {
        body: {
          incident_data: incident,
          analysis_type: analysisType,
          related_sds_documents: relatedSDSDocuments,
          facility_data: facilityData
        }
      });

      if (error) {
        console.error('❌ Analysis function error:', error);
        throw new Error(error.message || 'Failed to generate analysis');
      }

      if (!data?.analysis) {
        throw new Error('No analysis received from AI');
      }

      // Store analysis in database
      const { data: savedAnalysis, error: saveError } = await supabase
        .from('incident_ai_analysis')
        .insert({
          incident_id: incident.id,
          analysis_type: analysisType,
          ai_response: data.analysis,
          confidence_score: data.confidence_score || 0.85,
          metadata: {
            model_used: 'gpt-4o-mini',
            usage: data.usage,
            sds_documents_count: relatedSDSDocuments.length
          }
        })
        .select()
        .single();

      if (saveError) {
        console.error('❌ Error saving analysis:', saveError);
        // Continue anyway - show the analysis even if save fails
      }

      // Add to local state
      const newAnalysis: AnalysisResult = {
        id: savedAnalysis?.id || Date.now().toString(),
        type: analysisType,
        content: data.analysis,
        confidence: data.confidence_score || 0.85,
        timestamp: new Date()
      };

      setAnalyses(prev => [...prev.filter(a => a.type !== analysisType), newAnalysis]);

      toast({
        title: "Analysis Complete",
        description: `Sarah has completed the ${analysisType.replace('_', ' ')} analysis.`,
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Unable to generate analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingAnalysis(null);
    }
  };

  const getAnalysisIcon = (type: AnalysisType) => {
    const analysisType = analysisTypes.find(t => t.key === type);
    return analysisType?.icon || Brain;
  };

  const renderAnalysisContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage 
                src="/lovable-uploads/9ec62de0-3471-44e9-9981-e1ddff927939.png" 
                alt="Sarah - Chemical Safety Manager"
              />
              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <Brain className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold">AI Safety Analysis</div>
              <div className="text-sm font-normal text-gray-600">
                Get expert insights from Sarah, your AI Chemical Safety Manager
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysisTypes.map((analysisType) => {
              const Icon = analysisType.icon;
              const isLoading = loadingAnalysis === analysisType.key;
              const hasAnalysis = analyses.some(a => a.type === analysisType.key);
              
              return (
                <Button
                  key={analysisType.key}
                  variant="outline"
                  className={`h-auto p-4 justify-start ${analysisType.color} hover:shadow-md transition-shadow`}
                  onClick={() => generateAnalysis(analysisType.key)}
                  disabled={isLoading || analysisType.disabled}
                >
                  <div className="flex items-start gap-3 w-full">
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin flex-shrink-0 mt-0.5" />
                    ) : (
                      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="text-left">
                      <div className="font-medium flex items-center gap-2">
                        {analysisType.title}
                        {hasAnalysis && <Badge variant="secondary" className="text-xs">Complete</Badge>}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {analysisType.description}
                      </div>
                      {analysisType.disabled && (
                        <div className="text-xs text-gray-500 mt-1">
                          No chemicals identified in this incident
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analyses.map((analysis) => {
        const Icon = getAnalysisIcon(analysis.type);
        const analysisTypeInfo = analysisTypes.find(t => t.key === analysis.type);
        
        return (
          <Card key={analysis.id} className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-blue-600" />
                  <span>{analysisTypeInfo?.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Confidence: {Math.round(analysis.confidence * 100)}%
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {analysis.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderAnalysisContent(analysis.content) }}
              />
            </CardContent>
          </Card>
        );
      })}

      {analyses.length === 0 && !loadingAnalysis && (
        <Card className="border-dashed border-2 border-gray-200">
          <CardContent className="pt-6 text-center text-gray-500">
            <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">No AI Analysis Yet</p>
            <p className="text-sm">
              Click on any analysis type above to get Sarah's expert insights on this incident.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
