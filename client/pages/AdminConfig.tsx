import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { showSuccessToast, showErrorToast } from '../store/slices/uiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Settings,
  MapPin,
  FileText,
  Users,
  Clock,
  Mail,
  Database,
  Plus,
  Edit,
  Trash2,
  Save,
  RefreshCw,
  Globe,
  Shield,
  AlertTriangle,
} from 'lucide-react';

interface Ward {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  subZones: SubZone[];
}

interface SubZone {
  id: string;
  name: string;
  wardId: string;
  description: string;
  isActive: boolean;
}

interface ComplaintType {
  id: string;
  name: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  slaHours: number;
  isActive: boolean;
}

interface SystemSetting {
  key: string;
  value: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
}

const AdminConfig: React.FC = () => {
  const dispatch = useAppDispatch();
  const { translations } = useAppSelector((state) => state.language);

  // State management
  const [wards, setWards] = useState<Ward[]>([
    {
      id: '1',
      name: 'Ward 1 - Central Zone',
      description: 'Central business district area',
      isActive: true,
      subZones: [
        { id: '1-1', name: 'MG Road', wardId: '1', description: 'Main shopping area', isActive: true },
        { id: '1-2', name: 'Broadway', wardId: '1', description: 'Commercial district', isActive: true },
      ]
    },
    {
      id: '2',
      name: 'Ward 2 - North Zone',
      description: 'Northern residential area',
      isActive: true,
      subZones: [
        { id: '2-1', name: 'Vytilla', wardId: '2', description: 'IT hub area', isActive: true },
        { id: '2-2', name: 'Kadavanthra', wardId: '2', description: 'Residential area', isActive: true },
      ]
    },
    {
      id: '3',
      name: 'Ward 3 - South Zone',
      description: 'Southern coastal area',
      isActive: true,
      subZones: [
        { id: '3-1', name: 'Marine Drive', wardId: '3', description: 'Waterfront area', isActive: true },
        { id: '3-2', name: 'Fort Kochi', wardId: '3', description: 'Heritage area', isActive: true },
      ]
    },
  ]);

  const [complaintTypes, setComplaintTypes] = useState<ComplaintType[]>([
    { id: '1', name: 'Water Supply', description: 'Water supply related issues', priority: 'HIGH', slaHours: 24, isActive: true },
    { id: '2', name: 'Electricity', description: 'Electrical problems and outages', priority: 'CRITICAL', slaHours: 12, isActive: true },
    { id: '3', name: 'Road Repair', description: 'Road maintenance and repairs', priority: 'MEDIUM', slaHours: 72, isActive: true },
    { id: '4', name: 'Garbage Collection', description: 'Waste management issues', priority: 'MEDIUM', slaHours: 48, isActive: true },
    { id: '5', name: 'Street Lighting', description: 'Street light maintenance', priority: 'LOW', slaHours: 48, isActive: true },
  ]);

  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([
    { key: 'OTP_EXPIRY_MINUTES', value: '5', description: 'OTP expiration time in minutes', type: 'number' },
    { key: 'MAX_FILE_SIZE_MB', value: '10', description: 'Maximum file upload size in MB', type: 'number' },
    { key: 'DEFAULT_SLA_HOURS', value: '48', description: 'Default SLA time in hours', type: 'number' },
    { key: 'ADMIN_EMAIL', value: 'admin@cochinsmart.gov.in', description: 'Administrator email address', type: 'string' },
    { key: 'SYSTEM_MAINTENANCE', value: 'false', description: 'System maintenance mode', type: 'boolean' },
    { key: 'NOTIFICATION_SETTINGS', value: '{"email":true,"sms":false}', description: 'Notification preferences', type: 'json' },
  ]);

  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [editingComplaintType, setEditingComplaintType] = useState<ComplaintType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Ward Management Functions
  const handleSaveWard = async (ward: Ward) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingWard?.id) {
        setWards(prev => prev.map(w => w.id === ward.id ? ward : w));
      } else {
        setWards(prev => [...prev, { ...ward, id: Date.now().toString() }]);
      }
      
      setEditingWard(null);
      dispatch(showSuccessToast('Ward Saved', `Ward "${ward.name}" has been saved successfully.`));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save ward. Please try again.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWard = async (wardId: string) => {
    if (!confirm('Are you sure you want to delete this ward?')) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setWards(prev => prev.filter(w => w.id !== wardId));
      
      dispatch(addNotification({
        type: 'success',
        title: 'Ward Deleted',
        message: 'Ward has been deleted successfully.',
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete ward. Please try again.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Complaint Type Management Functions
  const handleSaveComplaintType = async (type: ComplaintType) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (editingComplaintType?.id) {
        setComplaintTypes(prev => prev.map(t => t.id === type.id ? type : t));
      } else {
        setComplaintTypes(prev => [...prev, { ...type, id: Date.now().toString() }]);
      }
      
      setEditingComplaintType(null);
      dispatch(addNotification({
        type: 'success',
        title: 'Complaint Type Saved',
        message: `Complaint type "${type.name}" has been saved successfully.`,
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save complaint type. Please try again.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComplaintType = async (typeId: string) => {
    if (!confirm('Are you sure you want to delete this complaint type?')) return;
    
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setComplaintTypes(prev => prev.filter(t => t.id !== typeId));
      
      dispatch(addNotification({
        type: 'success',
        title: 'Complaint Type Deleted',
        message: 'Complaint type has been deleted successfully.',
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete complaint type. Please try again.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // System Settings Functions
  const handleUpdateSystemSetting = async (key: string, value: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setSystemSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
      
      dispatch(addNotification({
        type: 'success',
        title: 'Setting Updated',
        message: `System setting "${key}" has been updated.`,
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update system setting. Please try again.',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'CRITICAL':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">System Configuration</h1>
        <p className="text-gray-300">
          Manage wards, complaint types, system settings, and administrative controls
        </p>
      </div>

      {/* Configuration Tabs */}
      <Tabs defaultValue="wards" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="wards">Wards & Zones</TabsTrigger>
          <TabsTrigger value="types">Complaint Types</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Ward Management */}
        <TabsContent value="wards" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Ward Management
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingWard({ id: '', name: '', description: '', isActive: true, subZones: [] })}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Ward
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingWard?.id ? 'Edit Ward' : 'Add New Ward'}
                      </DialogTitle>
                    </DialogHeader>
                    {editingWard && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="wardName">Ward Name</Label>
                          <Input
                            id="wardName"
                            value={editingWard.name}
                            onChange={(e) => setEditingWard({ ...editingWard, name: e.target.value })}
                            placeholder="Enter ward name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="wardDescription">Description</Label>
                          <Textarea
                            id="wardDescription"
                            value={editingWard.description}
                            onChange={(e) => setEditingWard({ ...editingWard, description: e.target.value })}
                            placeholder="Enter ward description"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setEditingWard(null)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => handleSaveWard(editingWard)}
                            disabled={isLoading || !editingWard.name}
                          >
                            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ward Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Sub-Zones</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wards.map((ward) => (
                    <TableRow key={ward.id}>
                      <TableCell className="font-medium">{ward.name}</TableCell>
                      <TableCell>{ward.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{ward.subZones.length} zones</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={ward.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {ward.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingWard(ward)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteWard(ward.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Complaint Types Management */}
        <TabsContent value="types" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Complaint Type Management
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button onClick={() => setEditingComplaintType({ 
                      id: '', 
                      name: '', 
                      description: '', 
                      priority: 'MEDIUM', 
                      slaHours: 48, 
                      isActive: true 
                    })}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingComplaintType?.id ? 'Edit Complaint Type' : 'Add New Complaint Type'}
                      </DialogTitle>
                    </DialogHeader>
                    {editingComplaintType && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="typeName">Type Name</Label>
                          <Input
                            id="typeName"
                            value={editingComplaintType.name}
                            onChange={(e) => setEditingComplaintType({ ...editingComplaintType, name: e.target.value })}
                            placeholder="Enter complaint type name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="typeDescription">Description</Label>
                          <Textarea
                            id="typeDescription"
                            value={editingComplaintType.description}
                            onChange={(e) => setEditingComplaintType({ ...editingComplaintType, description: e.target.value })}
                            placeholder="Enter type description"
                          />
                        </div>
                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Select
                            value={editingComplaintType.priority}
                            onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => 
                              setEditingComplaintType({ ...editingComplaintType, priority: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW">Low</SelectItem>
                              <SelectItem value="MEDIUM">Medium</SelectItem>
                              <SelectItem value="HIGH">High</SelectItem>
                              <SelectItem value="CRITICAL">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="slaHours">SLA Hours</Label>
                          <Input
                            id="slaHours"
                            type="number"
                            value={editingComplaintType.slaHours}
                            onChange={(e) => setEditingComplaintType({ ...editingComplaintType, slaHours: parseInt(e.target.value) })}
                            placeholder="Enter SLA hours"
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setEditingComplaintType(null)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => handleSaveComplaintType(editingComplaintType)}
                            disabled={isLoading || !editingComplaintType.name}
                          >
                            {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Save
                          </Button>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>SLA (Hours)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complaintTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.description}</TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(type.priority)}>
                          {type.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{type.slaHours}h</TableCell>
                      <TableCell>
                        <Badge className={type.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {type.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingComplaintType(type)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteComplaintType(type.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                System Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {systemSettings.map((setting) => (
                  <div key={setting.key} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{setting.key}</h3>
                        <p className="text-sm text-gray-600">{setting.description}</p>
                      </div>
                      <Badge variant="secondary">{setting.type}</Badge>
                    </div>
                    <div className="mt-3">
                      {setting.type === 'boolean' ? (
                        <Select
                          value={setting.value}
                          onValueChange={(value) => handleUpdateSystemSetting(setting.key, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : setting.type === 'json' ? (
                        <Textarea
                          value={setting.value}
                          onChange={(e) => handleUpdateSystemSetting(setting.key, e.target.value)}
                          placeholder="Enter JSON value"
                          rows={3}
                        />
                      ) : (
                        <Input
                          type={setting.type === 'number' ? 'number' : 'text'}
                          value={setting.value}
                          onChange={(e) => handleUpdateSystemSetting(setting.key, e.target.value)}
                          placeholder={`Enter ${setting.type} value`}
                          className="max-w-md"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Database Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Backup Database
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Restore Database
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Optimize Tables
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Password Policies
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Session Management
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Security Logs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Email Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  SMTP Settings
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Email Templates
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Email Service
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Localization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Globe className="h-4 w-4 mr-2" />
                  Manage Languages
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Translation Keys
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Translations
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminConfig;
