import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessCategory } from '@/lib/hostelMapping';
import { supabase } from '@/integrations/supabase/client';
import { ComplaintCard } from '@/components/ComplaintCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PostComplaintDialog } from '@/components/PostComplaintDialog';
import { Shield, Filter } from 'lucide-react';

type SortOption = 'recent' | 'popular';

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, 'up' | 'down'>>({});
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  useEffect(() => {
    if (!loading && profile && category) {
      if (!canAccessCategory(profile.hostel, category)) {
        // Show access denied
        return;
      }
      loadComplaints();
      loadUserVotes();
    }
  }, [profile, category, loading, sortBy]);

  const loadComplaints = async () => {
    if (!category) return;
    
    setLoadingComplaints(true);
    try {
      let query = supabase
        .from('complaints')
        .select(`
          *,
          profiles:user_id (name, registration_number)
        `)
        .eq('category', category);

      if (sortBy === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('upvotes', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error loading complaints:', error);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const loadUserVotes = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('votes')
        .select('complaint_id, vote_type')
        .eq('user_id', profile.id);

      if (error) throw error;

      const votesMap: Record<string, 'up' | 'down'> = {};
      data?.forEach((vote) => {
        votesMap[vote.complaint_id] = vote.vote_type as 'up' | 'down';
      });
      setUserVotes(votesMap);
    } catch (error) {
      console.error('Error loading user votes:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!profile || !category) {
    return null;
  }

  if (!canAccessCategory(profile.hostel, category)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Shield className="h-16 w-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You are not authorized to access this hostel section.
          </p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">{category}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <PostComplaintDialog />
          </div>
        </div>

        {loadingComplaints ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">No complaints yet in this section.</p>
            <PostComplaintDialog />
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                userVote={userVotes[complaint.id]}
                onVoteChange={() => {
                  loadComplaints();
                  loadUserVotes();
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
