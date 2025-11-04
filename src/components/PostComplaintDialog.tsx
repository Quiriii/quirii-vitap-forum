import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { canAccessCategory, ALL_CATEGORIES } from '@/lib/hostelMapping';
import { z } from 'zod';
import { PlusCircle, Upload } from 'lucide-react';

const complaintSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  category: z.string().min(1, 'Please select a category'),
});

export function PostComplaintDialog() {
  const { user, profile, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!isAdmin && !profile) return;

    setLoading(true);
    try {
      // Validate
      const validated = complaintSchema.parse({ title, description, category });

      // Check access (skip for admin)
      if (!isAdmin && profile && !canAccessCategory(profile.hostel, validated.category, isAdmin)) {
        toast.error('You do not have access to post in this category');
        setLoading(false);
        return;
      }

      let imageUrl = null;

      // Upload image if exists
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('complaint-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('complaint-images')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Create complaint
      const { error: insertError } = await supabase
        .from('complaints')
        .insert({
          user_id: user.id,
          category: validated.category,
          title: validated.title,
          description: validated.description,
          image_url: imageUrl,
          is_anonymous: isAnonymous,
        });

      if (insertError) throw insertError;

      toast.success('Complaint posted successfully!');
      setOpen(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('');
      setIsAnonymous(false);
      setImageFile(null);
      setImagePreview(null);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || 'Error posting complaint');
      }
    } finally {
      setLoading(false);
    }
  };

  const accessibleCategories = ALL_CATEGORIES.filter(cat => 
    isAdmin || (profile ? canAccessCategory(profile.hostel, cat, isAdmin) : false)
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <PlusCircle className="h-5 w-5" />
          Post Your First Complaint
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a Complaint</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {accessibleCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your complaint"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your complaint in detail..."
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image')?.click()}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {imageFile ? 'Change Image' : 'Upload Image'}
              </Button>
              {imageFile && <span className="text-sm text-muted-foreground">{imageFile.name}</span>}
            </div>
            {imagePreview && (
              <img src={imagePreview} alt="Preview" className="mt-2 rounded-lg max-h-48 object-cover" />
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
              <Label htmlFor="anonymous" className="cursor-pointer">
                Post Anonymously
              </Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Posting...' : 'Post Complaint'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
