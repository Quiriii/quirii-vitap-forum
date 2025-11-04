import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Reply {
  id: string;
  reply_text: string;
  created_at: string;
}

interface AdminReplySectionProps {
  complaintId: string;
  currentStatus: string;
  replies: Reply[];
  onUpdate: () => void;
}

export function AdminReplySection({ complaintId, currentStatus, replies, onUpdate }: AdminReplySectionProps) {
  const { user, isAdmin } = useAuth();
  const [replyText, setReplyText] = useState('');
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleSubmitReply = async () => {
    if (!replyText.trim() || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('complaint_replies').insert({
        complaint_id: complaintId,
        admin_id: user.id,
        reply_text: replyText.trim(),
      });

      if (error) throw error;

      setReplyText('');
      toast.success('Reply posted successfully');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Error posting reply');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status: newStatus })
        .eq('id', complaintId);

      if (error) throw error;

      setStatus(newStatus);
      toast.success('Status updated successfully');
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || 'Error updating status');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="space-y-4 mt-4 pt-4 border-t">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h4 className="font-semibold">Admin Actions</h4>
      </div>

      {/* Status Update */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Update Status</label>
        <Select value={status} onValueChange={handleStatusChange} disabled={loading}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Post Reply */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Post Public Reply</label>
        <Textarea
          placeholder="Write your response to this complaint..."
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          rows={3}
        />
        <Button
          onClick={handleSubmitReply}
          disabled={loading || !replyText.trim()}
          size="sm"
        >
          {loading ? 'Posting...' : 'Post Reply'}
        </Button>
      </div>

      {/* Display Replies */}
      {replies.length > 0 && (
        <div className="space-y-2">
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
    </div>
  );
}
