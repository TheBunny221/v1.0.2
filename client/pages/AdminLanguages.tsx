import React, { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  Globe,
  Save,
  Upload,
  Download,
  Languages,
} from "lucide-react";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";

interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isActive: boolean;
  isDefault: boolean;
  direction: "ltr" | "rtl";
  completionPercentage: number;
}

interface TranslationKey {
  key: string;
  category: string;
  en: string;
  hi?: string;
  ml?: string;
  [key: string]: string | undefined;
}

const AdminLanguages: React.FC = () => {
  const dispatch = useAppDispatch();
  const { translations } = useAppSelector((state) => state.language);
  const [languages, setLanguages] = useState<Language[]>([
    {
      id: "1",
      code: "en",
      name: "English",
      nativeName: "English",
      isActive: true,
      isDefault: true,
      direction: "ltr",
      completionPercentage: 100,
    },
    {
      id: "2",
      code: "hi",
      name: "Hindi",
      nativeName: "हिन्दी",
      isActive: true,
      isDefault: false,
      direction: "ltr",
      completionPercentage: 95,
    },
    {
      id: "3",
      code: "ml",
      name: "Malayalam",
      nativeName: "മലയാളം",
      isActive: true,
      isDefault: false,
      direction: "ltr",
      completionPercentage: 90,
    },
  ]);

  const [translationKeys, setTranslationKeys] = useState<TranslationKey[]>([
    {
      key: "common.submit",
      category: "common",
      en: "Submit",
      hi: "जमा करना",
      ml: "സമർപ്പിക്കുക",
    },
    {
      key: "common.cancel",
      category: "common",
      en: "Cancel",
      hi: "रद्द करना",
      ml: "റദ്ദാക്കുക",
    },
    {
      key: "nav.home",
      category: "navigation",
      en: "Home",
      hi: "होम",
      ml: "ഹോം",
    },
  ]);

  const [isAddingLanguage, setIsAddingLanguage] = useState(false);
  const [isEditingTranslation, setIsEditingTranslation] = useState(false);
  const [selectedTranslation, setSelectedTranslation] =
    useState<TranslationKey | null>(null);
  const [newLanguage, setNewLanguage] = useState({
    code: "",
    name: "",
    nativeName: "",
    direction: "ltr" as "ltr" | "rtl",
  });

  const [newTranslationKey, setNewTranslationKey] = useState({
    key: "",
    category: "",
    en: "",
  });

  const handleAddLanguage = () => {
    if (!newLanguage.code || !newLanguage.name || !newLanguage.nativeName) {
      dispatch(showErrorToast("Validation Error", "All fields are required"));
      return;
    }

    const language: Language = {
      id: Date.now().toString(),
      code: newLanguage.code.toLowerCase(),
      name: newLanguage.name,
      nativeName: newLanguage.nativeName,
      isActive: false,
      isDefault: false,
      direction: newLanguage.direction,
      completionPercentage: 0,
    };

    setLanguages([...languages, language]);
    setNewLanguage({ code: "", name: "", nativeName: "", direction: "ltr" });
    setIsAddingLanguage(false);
    dispatch(showSuccessToast("Success", "Language added successfully"));
  };

  const handleToggleLanguage = (id: string) => {
    setLanguages(
      languages.map((lang) =>
        lang.id === id ? { ...lang, isActive: !lang.isActive } : lang,
      ),
    );
  };

  const handleSetDefault = (id: string) => {
    setLanguages(
      languages.map((lang) => ({
        ...lang,
        isDefault: lang.id === id,
        isActive: lang.id === id ? true : lang.isActive,
      })),
    );
    dispatch(showSuccessToast("Success", "Default language updated"));
  };

  const handleDeleteLanguage = (id: string) => {
    const language = languages.find((l) => l.id === id);
    if (language?.isDefault) {
      dispatch(showErrorToast("Error", "Cannot delete default language"));
      return;
    }
    setLanguages(languages.filter((lang) => lang.id !== id));
    dispatch(showSuccessToast("Success", "Language deleted successfully"));
  };

  const handleAddTranslationKey = () => {
    if (
      !newTranslationKey.key ||
      !newTranslationKey.category ||
      !newTranslationKey.en
    ) {
      dispatch(showErrorToast("Validation Error", "All fields are required"));
      return;
    }

    const translationKey: TranslationKey = {
      key: newTranslationKey.key,
      category: newTranslationKey.category,
      en: newTranslationKey.en,
    };

    setTranslationKeys([...translationKeys, translationKey]);
    setNewTranslationKey({ key: "", category: "", en: "" });
    dispatch(showSuccessToast("Success", "Translation key added successfully"));
  };

  const handleUpdateTranslation = (updatedKey: TranslationKey) => {
    setTranslationKeys(
      translationKeys.map((key) =>
        key.key === updatedKey.key ? updatedKey : key,
      ),
    );
    setIsEditingTranslation(false);
    setSelectedTranslation(null);
    dispatch(showSuccessToast("Success", "Translation updated successfully"));
  };

  const exportTranslations = () => {
    const data = {
      languages,
      translations: translationKeys,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "translations-export.json";
    a.click();
    URL.revokeObjectURL(url);
    dispatch(showSuccessToast("Success", "Translations exported successfully"));
  };

  const categories = Array.from(
    new Set(translationKeys.map((t) => t.category)),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {translations?.admin?.languageManagement || "Language Management"}
          </h1>
          <p className="text-muted-foreground">
            Configure available languages and manage translations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={exportTranslations} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Languages Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Globe className="mr-2 h-5 w-5" />
              Available Languages
            </CardTitle>
            <Dialog open={isAddingLanguage} onOpenChange={setIsAddingLanguage}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Language
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Language</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="code">Language Code</Label>
                    <Input
                      id="code"
                      placeholder="e.g., fr, de, es"
                      value={newLanguage.code}
                      onChange={(e) =>
                        setNewLanguage({ ...newLanguage, code: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">English Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., French, German, Spanish"
                      value={newLanguage.name}
                      onChange={(e) =>
                        setNewLanguage({ ...newLanguage, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="nativeName">Native Name</Label>
                    <Input
                      id="nativeName"
                      placeholder="e.g., Français, Deutsch, Español"
                      value={newLanguage.nativeName}
                      onChange={(e) =>
                        setNewLanguage({
                          ...newLanguage,
                          nativeName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="direction">Text Direction</Label>
                    <Select
                      value={newLanguage.direction}
                      onValueChange={(value: "ltr" | "rtl") =>
                        setNewLanguage({ ...newLanguage, direction: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ltr">Left to Right</SelectItem>
                        <SelectItem value="rtl">Right to Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsAddingLanguage(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddLanguage}>Add Language</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Language</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Direction</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {languages.map((language) => (
                <TableRow key={language.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{language.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {language.nativeName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{language.code}</Badge>
                  </TableCell>
                  <TableCell>{language.direction.toUpperCase()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${language.completionPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">
                        {language.completionPercentage}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={language.isActive}
                      onCheckedChange={() => handleToggleLanguage(language.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {language.isDefault ? (
                      <Badge>Default</Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(language.id)}
                      >
                        Set Default
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLanguage(language.id)}
                        disabled={language.isDefault}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Translation Keys Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Languages className="mr-2 h-5 w-5" />
              Translation Keys
            </CardTitle>
            <div className="flex space-x-2">
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Add New Translation Key */}
          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
            <h3 className="font-medium mb-3">Add New Translation Key</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Translation key (e.g., common.submit)"
                value={newTranslationKey.key}
                onChange={(e) =>
                  setNewTranslationKey({
                    ...newTranslationKey,
                    key: e.target.value,
                  })
                }
              />
              <Input
                placeholder="Category"
                value={newTranslationKey.category}
                onChange={(e) =>
                  setNewTranslationKey({
                    ...newTranslationKey,
                    category: e.target.value,
                  })
                }
              />
              <Input
                placeholder="English translation"
                value={newTranslationKey.en}
                onChange={(e) =>
                  setNewTranslationKey({
                    ...newTranslationKey,
                    en: e.target.value,
                  })
                }
              />
              <Button onClick={handleAddTranslationKey}>
                <Plus className="mr-2 h-4 w-4" />
                Add Key
              </Button>
            </div>
          </div>

          {/* Translation Keys Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>English</TableHead>
                <TableHead>Hindi</TableHead>
                <TableHead>Malayalam</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {translationKeys.map((translationKey) => (
                <TableRow key={translationKey.key}>
                  <TableCell className="font-mono text-sm">
                    {translationKey.key}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{translationKey.category}</Badge>
                  </TableCell>
                  <TableCell>{translationKey.en}</TableCell>
                  <TableCell>
                    {translationKey.hi || (
                      <span className="text-muted-foreground">
                        Not translated
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {translationKey.ml || (
                      <span className="text-muted-foreground">
                        Not translated
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTranslation(translationKey);
                        setIsEditingTranslation(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Translation Dialog */}
      <Dialog
        open={isEditingTranslation}
        onOpenChange={setIsEditingTranslation}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Translation</DialogTitle>
          </DialogHeader>
          {selectedTranslation && (
            <EditTranslationForm
              translation={selectedTranslation}
              languages={languages.filter((l) => l.isActive)}
              onSave={handleUpdateTranslation}
              onCancel={() => {
                setIsEditingTranslation(false);
                setSelectedTranslation(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface EditTranslationFormProps {
  translation: TranslationKey;
  languages: Language[];
  onSave: (translation: TranslationKey) => void;
  onCancel: () => void;
}

const EditTranslationForm: React.FC<EditTranslationFormProps> = ({
  translation,
  languages,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<TranslationKey>(translation);

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="key">Translation Key</Label>
        <Input
          id="key"
          value={formData.key}
          onChange={(e) => setFormData({ ...formData, key: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) =>
            setFormData({ ...formData, category: e.target.value })
          }
        />
      </div>
      {languages.map((language) => (
        <div key={language.code}>
          <Label htmlFor={language.code}>
            {language.name} ({language.nativeName})
          </Label>
          <Textarea
            id={language.code}
            value={formData[language.code] || ""}
            onChange={(e) =>
              setFormData({ ...formData, [language.code]: e.target.value })
            }
            placeholder={`Enter ${language.name} translation...`}
            rows={2}
          />
        </div>
      ))}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default AdminLanguages;
