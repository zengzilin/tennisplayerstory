import React, { useState, useRef, useEffect } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const PlayerTableRow = ({ player, isSelected, onSelect, onEdit, onDelete, onInlineUpdate }) => {
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingField]);

  const handleDoubleClick = (field, value) => {
    setEditingField(field);
    setEditValue(value || '');
  };

  const handleKeyDown = async (e) => {
    if (e.key === 'Enter') {
      await saveInlineEdit();
    } else if (e.key === 'Escape') {
      setEditingField(null);
    }
  };

  const saveInlineEdit = async () => {
    if (editValue === (player[editingField] || '')) {
      setEditingField(null);
      return;
    }

    setIsSaving(true);
    try {
      let finalValue = editValue;
      if (['ranking', 'points', 'age'].includes(editingField)) {
        finalValue = editValue ? Number(editValue) : null;
      }
      await onInlineUpdate(player.id, { [editingField]: finalValue });
      setEditingField(null);
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const renderCell = (field, value, isNumber = false) => {
    if (editingField === field) {
      return (
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type={isNumber ? 'number' : 'text'}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveInlineEdit}
            className="h-8 w-full min-w-[80px]"
            disabled={isSaving}
          />
          {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      );
    }
    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[24px]"
        onDoubleClick={() => handleDoubleClick(field, value)}
        title="Double click to edit"
      >
        {value || '-'}
      </div>
    );
  };

  return (
    <TableRow className="hover:bg-muted/30 transition-colors">
      <TableCell className="w-[40px]">
        <Checkbox checked={isSelected} onCheckedChange={(checked) => onSelect(player.id, checked)} />
      </TableCell>
      <TableCell>{renderCell('ranking', player.ranking, true)}</TableCell>
      <TableCell className="font-medium">{renderCell('name', player.name)}</TableCell>
      <TableCell>{renderCell('country', player.country)}</TableCell>
      <TableCell>{renderCell('points', player.points, true)}</TableCell>
      <TableCell>{renderCell('age', player.age, true)}</TableCell>
      <TableCell>
        <Badge variant="outline" className="uppercase">{player.source}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {new Date(player.updated).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(player)}>
            <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(player)}>
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default PlayerTableRow;