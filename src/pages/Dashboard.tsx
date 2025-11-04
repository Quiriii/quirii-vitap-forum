import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PostComplaintDialog } from '@/components/PostComplaintDialog';
import { MessageCircle, TrendingUp, CheckCircle, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ThemeToggle } from '@/components/ThemeToggle';
export default function Dashboard() {
  const {
    user,
    profile,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    resolved: 0
  });
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);
  useEffect(() => {
    if (profile) {
      loadStats();
    }
  }, [profile]);
  const loadStats = async () => {
    try {
      const {
        count: totalCount
      } = await supabase.from('complaints').select('*', {
        count: 'exact',
        head: true
      });
      const {
        count: inProgressCount
      } = await supabase.from('complaints').select('*', {
        count: 'exact',
        head: true
      }).eq('status', 'in_progress');
      const {
        count: resolvedCount
      } = await supabase.from('complaints').select('*', {
        count: 'exact',
        head: true
      }).eq('status', 'resolved');
      setStats({
        total: totalCount || 0,
        inProgress: inProgressCount || 0,
        resolved: resolvedCount || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>;
  }
  return <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">Quirii – The VIT-AP Complaint Forum</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Speak. Share. Solve.</p>
            <p className="text-xs text-muted-foreground">Every Query Deserves an Answer.</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              <MessageCircle className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <TrendingUp className="h-5 w-5 text-[hsl(var(--status-in-progress))]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[hsl(var(--status-in-progress))]">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-5 w-5 text-[hsl(var(--status-resolved))]" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[hsl(var(--status-resolved))]">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Get Started</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Select a section from the sidebar to view complaints or post your own. Your voice matters in
              making VIT-AP better for everyone.
            </p>
            <PostComplaintDialog />
          </CardContent>
        </Card>
      </main>
    </div>;
}