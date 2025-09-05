import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { toast } from "./ui/use-toast";

const AdminSeeder: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<any>(null);

  const seedAdminUser = async () => {
    setIsSeeding(true);
    try {
      const response = await fetch("/api/test/seed-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        setSeedResult(result);
        toast({
          title: "Success",
          description: "Admin user created successfully!",
        });
      } else {
        throw new Error(result.message || "Failed to create admin user");
      }
    } catch (error: any) {
      console.error("Failed to seed admin user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create admin user",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
          Development Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          This tool creates test users for development and testing purposes.
        </p>

        <Button onClick={seedAdminUser} disabled={isSeeding} className="w-full">
          {isSeeding ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating Users...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Create Test Users
            </>
          )}
        </Button>

        {seedResult && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <h4 className="font-semibold text-green-800 mb-2">
              Test Users Created:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="bg-white p-2 rounded border">
                <p>
                  <strong>Admin:</strong> {seedResult.data.admin.email}
                </p>
                <p>
                  <strong>Password:</strong> {seedResult.data.admin.password}
                </p>
              </div>
              {seedResult.data.testUsers?.map((user: any, index: number) => (
                <div key={index} className="bg-white p-2 rounded border">
                  <p>
                    <strong>{user.role}:</strong> {user.email}
                  </p>
                  <p>
                    <strong>Password:</strong> {user.password}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminSeeder;
