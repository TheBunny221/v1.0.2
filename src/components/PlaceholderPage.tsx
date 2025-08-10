import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  backPath?: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ 
  title, 
  description, 
  icon = <Construction className="h-12 w-12" />,
  backPath = '/'
}) => {
  return (
    <div className="max-w-2xl mx-auto mt-16">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4 text-muted-foreground">
            {icon}
          </div>
          <CardTitle className="text-2xl mb-2">{title}</CardTitle>
          <p className="text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            This feature is currently under development. 
            Continue prompting to help build out this functionality.
          </p>
          <div className="flex justify-center space-x-4">
            <Button asChild variant="outline">
              <Link to={backPath}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Link>
            </Button>
            <Button asChild>
              <Link to="/">
                Return Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderPage;
