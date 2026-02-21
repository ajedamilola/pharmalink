import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

const AdminSettings = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Platform Settings</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground">
        <p>Platform configuration management coming soon. This section will include:</p>
        <ul className="list-disc pl-6 mt-2 space-y-1 text-sm">
          <li>Buy-back discount tier configuration</li>
          <li>Auto-restock rules</li>
          <li>Platform fee settings</li>
          <li>Notification preferences</li>
        </ul>
      </CardContent>
    </Card>
  );
};

export default AdminSettings;
