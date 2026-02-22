import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, ChevronDown, Loader2 } from 'lucide-react';

interface DrugComboboxProps {
  drugs: any[];
  value: any | null;
  onSelect: (drug: any | null) => void;
  allowCreate: boolean;
  onCreate?: (name: string) => Promise<any | null>;
  placeholder?: string;
}

export const DrugCombobox = ({
  drugs,
  value,
  onSelect,
  allowCreate,
  onCreate,
  placeholder = "Select drug...",
}: DrugComboboxProps) => {
  const [drugComboboxOpen, setDrugComboboxOpen] = useState(false);
  const [drugSearchValue, setDrugSearchValue] = useState('');
  const [creatingDrug, setCreatingDrug] = useState(false);

  const handleSelect = async (drug: any) => {
    if (drug === 'create') {
      if (!onCreate) return;
      setCreatingDrug(true);
      const newDrug = await onCreate(drugSearchValue);
      setCreatingDrug(false);
      if (newDrug) {
        onSelect(newDrug);
        setDrugComboboxOpen(false);
        setDrugSearchValue('');
      }
    } else {
      onSelect(drug);
      setDrugComboboxOpen(false);
      setDrugSearchValue('');
    }
  };

  const filteredDrugs = drugs.filter(d =>
    d.name.toLowerCase().includes(drugSearchValue.toLowerCase())
  );

  const canCreate = allowCreate && drugSearchValue &&
    !drugs.some(d => d.name.toLowerCase() === drugSearchValue.toLowerCase());

  return (
    <Popover open={drugComboboxOpen} onOpenChange={setDrugComboboxOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={drugComboboxOpen} className="w-full justify-between">
          {value ? value.name : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search drugs..."
            value={drugSearchValue}
            onValueChange={setDrugSearchValue}
          />
          <CommandList>
            <CommandEmpty>No drugs found.</CommandEmpty>
            <CommandGroup>
              {filteredDrugs.map(drug => (
                <CommandItem
                  key={drug.id}
                  value={drug.name}
                  onSelect={() => handleSelect(drug)}
                >
                  <Check className={value?.id === drug.id ? "opacity-100" : "opacity-0"} />
                  {drug.name}
                </CommandItem>
              ))}
              {canCreate && (
                <CommandItem
                  value={`create-${drugSearchValue}`}
                  onSelect={() => handleSelect('create')}
                  disabled={creatingDrug}
                >
                  {creatingDrug ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create "{drugSearchValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
