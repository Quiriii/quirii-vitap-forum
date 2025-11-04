import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { AdminReplySection } from './AdminReplySection';

interface ComplaintCardProps {
  complaint: {
    id: string;
    title: string;
    description: string;
    image_url?: string;
    is_anonymous: boolean;
    upvotes: number;
    downvotes: number;
    status: 'open' | 'in_progress' | 'resolved';
    created_at: string;
    profiles?: {
      name: string;
      registration_number: string;
    };
  };
  userVote?: 'up' | 'down' | null;
  onVoteChange?: () => void;
}

export function ComplaintCard({ complaint, userVote, onVoteChange }: ComplaintCardProps) {
  const { user, isAdmin } = useAuth();
  const [voting, setVoting] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(true);

  useEffect(() => {
    fetchReplies();
  }, [complaint.id]);

  const fetchReplies = async () => {
    try {
      const { data, error } = await supabase
        .from('complaint_replies')
        .select('*')
        .eq('complaint_id', complaint.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user) {
      toast.error('Please login to vote');
      return;
    }

    setVoting(true);
    try {
      if (userVote === voteType) {
        // Remove vote
        await supabase
          .from('votes')
          .delete()
          .eq('user_id', user.id)
          .eq('complaint_id', complaint.id);
      } else if (userVote) {
        // Change vote
        await supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('user_id', user.id)
          .eq('complaint_id', complaint.id);
      } else {
        // New vote
        await supabase
          .from('votes')
          .insert({
            user_id: user.id,
            complaint_id: complaint.id,
            vote_type: voteType,
          });
      }
      onVoteChange?.();
    } catch (error: any) {
      toast.error(error.message || 'Error voting');
    } finally {
      setVoting(false);
    }
  };

  const getStatusBadge = () => {
    switch (complaint.status) {
      case 'in_progress':
        return (
          <Badge variant="outline" className="border-[hsl(var(--status-in-progress))] text-[hsl(var(--status-in-progress))]">
            <Clock className="mr-1 h-3 w-3" />
            In Progress
          </Badge>
        );
      case 'resolved':
        return (
          <Badge variant="outline" className="border-[hsl(var(--status-resolved))] text-[hsl(var(--status-resolved))]">
            <CheckCircle className="mr-1 h-3 w-3" />
            Resolved
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{complaint.title}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>
                {complaint.is_anonymous
                  ? 'Anonymous'
                  : `${complaint.profiles?.name} (${complaint.profiles?.registration_number})`}
              </span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}</span>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-foreground">{complaint.description}</p>
        {complaint.image_url && (
          <img
            src={complaint.image_url}
            alt="Complaint"
            className="rounded-lg w-full max-h-64 object-cover"
          />
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="flex items-center gap-2 w-full">
          <Button
            variant={userVote === 'up' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleVote('up')}
            disabled={voting}
            className="gap-1"
          >
            <ThumbsUp className="h-4 w-4" />
            {complaint.upvotes}
          </Button>
          <Button
            variant={userVote === 'down' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleVote('down')}
            disabled={voting}
            className="gap-1"
          >
            <ThumbsDown className="h-4 w-4" />
            {complaint.downvotes}
          </Button>
        </div>

        {/* Show public replies to all users */}
        {!loadingReplies && replies.length > 0 && !isAdmin && (
          <div className="w-full space-y-2 pt-4 border-t">
            <h5 className="text-sm font-medium">Admin Replies</h5>
            {replies.map((reply) => (
              <Card key={reply.id} className="p-3 bg-muted/50">
                <p className="text-sm text-foreground">{reply.reply_text}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Admin • {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* Admin actions section */}
        {isAdmin && (
          <AdminReplySection
            complaintId={complaint.id}
            currentStatus={complaint.status}
            replies={replies}
            onUpdate={() => {
              fetchReplies();
              onVoteChange?.();
            }}
          />
        )}
      </CardFooter>
    </Card>
  );
}
