import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';

// Test component to verify Select works with proper values
const SelectTest: React.FC = () => {
  const [value, setValue] = useState('unassigned');

  return (
    <div className="p-4 space-y-4">
      <h3>Select Test (should work without errors)</h3>
      
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select assignment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">Unassigned</SelectItem>
          <SelectItem value="user1">User 1</SelectItem>
          <SelectItem value="user2">User 2</SelectItem>
        </SelectContent>
      </Select>
      
      <div className="text-sm text-gray-600">
        Current value: {value}
      </div>
      
      <Button onClick={() => setValue('unassigned')}>
        Reset to Unassigned
      </Button>
    </div>
  );
};

export default SelectTest;
