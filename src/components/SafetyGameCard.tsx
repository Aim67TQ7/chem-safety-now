
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Target, Star, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface SafetyGameCardProps {
  facilityId: string;
}

const SafetyGameCard = ({ facilityId }: SafetyGameCardProps) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [safetyScore, setSafetyScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const calculateAchievements = async () => {
      try {
        // Get facility data for calculations
        const { data: sdsCount } = await supabase
          .from('sds_interactions')
          .select('id')
          .eq('facility_id', facilityId);

        const { data: incidentCount } = await supabase
          .from('incidents')
          .select('id')
          .eq('facility_id', facilityId);

        const { data: qrCount } = await supabase
          .from('qr_code_interactions')
          .select('id')
          .eq('facility_id', facilityId);

        const { data: aiCount } = await supabase
          .from('ai_conversations')
          .select('id')
          .eq('facility_id', facilityId);

        const sdsSearches = sdsCount?.length || 0;
        const totalIncidents = incidentCount?.length || 0;
        const qrScans = qrCount?.length || 0;
        const aiChats = aiCount?.length || 0;

        // Calculate safety score (0-100)
        const baseScore = 80; // Starting score
        const incidentPenalty = Math.min(totalIncidents * 5, 30); // Max 30 point penalty
        const activityBonus = Math.min((sdsSearches + qrScans + aiChats) * 2, 50); // Max 50 point bonus
        const finalScore = Math.max(0, Math.min(100, baseScore - incidentPenalty + activityBonus));
        setSafetyScore(finalScore);

        // Define achievements
        const achievementList: Achievement[] = [
          {
            id: 'first-search',
            name: 'Safety Seeker',
            description: 'Performed your first SDS search',
            icon: Star,
            unlocked: sdsSearches > 0,
            progress: Math.min(sdsSearches, 1),
            maxProgress: 1
          },
          {
            id: 'search-master',
            name: 'Research Master',
            description: 'Completed 10 SDS searches',
            icon: Target,
            unlocked: sdsSearches >= 10,
            progress: Math.min(sdsSearches, 10),
            maxProgress: 10
          },
          {
            id: 'incident-reporter',
            name: 'Safety Reporter',
            description: 'Submitted your first incident report',
            icon: Award,
            unlocked: totalIncidents > 0,
            progress: Math.min(totalIncidents, 1),
            maxProgress: 1
          },
          {
            id: 'tech-savvy',
            name: 'Tech Savvy',
            description: 'Used QR codes 5 times',
            icon: Trophy,
            unlocked: qrScans >= 5,
            progress: Math.min(qrScans, 5),
            maxProgress: 5
          }
        ];

        setAchievements(achievementList);
      } catch (error) {
        console.error('Error calculating achievements:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateAchievements();
  }, [facilityId]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>Safety Progress</span>
          </div>
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
            Score: {safetyScore}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Safety Score Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Safety Score</span>
              <span className="font-medium">{safetyScore}/100</span>
            </div>
            <Progress value={safetyScore} className="h-2" />
          </div>

          {/* Achievements Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">Achievements</h4>
              <span className="text-xs text-gray-500">{unlockedCount}/{achievements.length} unlocked</span>
            </div>
            
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                        achievement.unlocked
                          ? 'bg-green-50 border-green-200 shadow-sm'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          achievement.unlocked
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          achievement.unlocked ? 'text-green-800' : 'text-gray-600'
                        }`}>
                          {achievement.name}
                        </p>
                        <p className="text-xs text-gray-500">{achievement.description}</p>
                        {achievement.maxProgress && achievement.maxProgress > 1 && (
                          <div className="mt-1">
                            <Progress 
                              value={(achievement.progress || 0) / achievement.maxProgress * 100} 
                              className="h-1"
                            />
                            <span className="text-xs text-gray-400">
                              {achievement.progress}/{achievement.maxProgress}
                            </span>
                          </div>
                        )}
                      </div>
                      {achievement.unlocked && (
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
                          ✓
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SafetyGameCard;
