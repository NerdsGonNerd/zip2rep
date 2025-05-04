import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { Dropdown, DropdownOption } from "@/components/shared/dropdown";
import { MultiSelect, MultiSelectOption } from "@/components/shared/multi-select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PreviewTable, TableColumn } from "@/components/shared/preview-table";
import { useAssignment } from "@/context/assignment-context";
import { useToastService } from "@/components/shared/toast-service";

// Reassignment mode type
type ReassignmentMode = "county" | "zip";

// Schema for the reassignment form
const reassignmentFormSchema = z.object({
  typeId: z.string().min(1, "Rep Type is required"),
  fromRepId: z.string().min(1, "From Sales Rep is required"),
  toRepId: z.string().min(1, "To Sales Rep is required"),
  mode: z.enum(["county", "zip"]),
  counties: z.array(z.string()).optional(),
  zipFrom: z.string().optional(),
  zipTo: z.string().optional(),
}).refine(data => {
  if (data.mode === "county") {
    return data.counties && data.counties.length > 0;
  } else {
    return data.zipFrom && data.zipTo && 
           /^\d{5}$/.test(data.zipFrom) && 
           /^\d{5}$/.test(data.zipTo) && 
           parseInt(data.zipFrom) <= parseInt(data.zipTo);
  }
}, {
  message: "You must select counties or enter a valid ZIP range",
  path: ["counties"]
});

type ReassignmentFormValues = z.infer<typeof reassignmentFormSchema>;

// Interface for displayed reassignments in the table
interface ReassignmentDisplay {
  id: number;
  typeId: number;
  typeName: string;
  fromRepId: number;
  fromRepName: string;
  toRepId: number;
  toRepName: string;
  location: string;
}

interface CurrentTerritory {
  zipCode: string;
  countyName?: string;
}

export default function Reassign() {
  const { service, loading, setLoading } = useAssignment();
  const { showSuccess, showError } = useToastService();
  
  // State for UI data
  const [repTypes, setRepTypes] = React.useState<DropdownOption[]>([]);
  const [fromSalesReps, setFromSalesReps] = React.useState<DropdownOption[]>([]);
  const [toSalesReps, setToSalesReps] = React.useState<DropdownOption[]>([]);
  const [availableCounties, setAvailableCounties] = React.useState<MultiSelectOption[]>([]);
  const [currentTerritories, setCurrentTerritories] = React.useState<CurrentTerritory[]>([]);
  const [selectedRepType, setSelectedRepType] = React.useState<string | undefined>();
  const [reassignments, setReassignments] = React.useState<ReassignmentDisplay[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  
  // Setup form with default values
  const form = useForm<ReassignmentFormValues>({
    resolver: zodResolver(reassignmentFormSchema),
    defaultValues: {
      typeId: "",
      fromRepId: "",
      toRepId: "",
      mode: "county",
      counties: [],
      zipFrom: "",
      zipTo: "",
    },
  });
  
  const { watch, setValue, reset } = form;
  const watchMode = watch("mode");
  const watchTypeId = watch("typeId");
  const watchFromRepId = watch("fromRepId");
  
  // Table columns for the preview
  const columns: TableColumn[] = [
    { header: "Type", accessor: "typeName" },
    { header: "From Rep", accessor: "fromRepName" },
    { header: "To Rep", accessor: "toRepName" },
    { header: "Location", accessor: "location" },
  ];
  
  // Load rep types on component mount
  React.useEffect(() => {
    async function loadRepTypes() {
      setLoading(true);
      try {
        const types = await service.getRepTypes();
        setRepTypes(types.map(type => ({ 
          value: type.typeId.toString(), 
          label: type.typeName 
        })));
      } catch (error) {
        showError("Failed to load rep types");
        console.error("Error loading rep types:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadRepTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Load from sales reps when rep type changes
  React.useEffect(() => {
    if (!watchTypeId) {
      setFromSalesReps([]);
      setValue("fromRepId", "");
      setValue("toRepId", "");
      return;
    }
    
    async function loadSalesReps() {
      setLoading(true);
      try {
        const reps = await service.getSalesReps(parseInt(watchTypeId));
        setFromSalesReps(reps.map(rep => ({ 
          value: rep.SalesRepId.toString(), 
          label: `${rep.SalesRepNo} (${rep.Division})` 
        })));
        
        // Set the selected rep type for reference
        setSelectedRepType(repTypes.find(t => t.value === watchTypeId)?.label);
        
        // Reset rep selections
        setValue("fromRepId", "");
        setValue("toRepId", "");
        
        // Clear current territories
        setCurrentTerritories([]);
      } catch (error) {
        showError("Failed to load sales reps");
        console.error("Error loading sales reps:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadSalesReps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchTypeId]);
  
  // Load to sales reps when from rep changes
  React.useEffect(() => {
    if (!watchTypeId || !watchFromRepId) {
      setToSalesReps([]);
      setValue("toRepId", "");
      return;
    }
    
    async function loadToSalesReps() {
      setLoading(true);
      try {
        // Get all reps of the same type
        const reps = await service.getSalesReps(parseInt(watchTypeId));
        // Filter out the selected "from" rep
        const filteredReps = reps.filter(rep => rep.SalesRepId.toString() !== watchFromRepId);
        
        setToSalesReps(filteredReps.map(rep => ({ 
          value: rep.SalesRepId.toString(), 
          label: `${rep.SalesRepNo} (${rep.Division})` 
        })));
        
        // Reset "to" rep selection
        setValue("toRepId", "");
      } catch (error) {
        showError("Failed to load sales reps");
        console.error("Error loading sales reps:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadToSalesReps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchFromRepId]);
  
  // Load current territories when from rep changes
  React.useEffect(() => {
    if (!watchFromRepId) {
      setCurrentTerritories([]);
      setAvailableCounties([]);
      return;
    }
    
    async function loadCurrentTerritories() {
      setLoading(true);
      try {
        const assignments = await service.getCurrentAssignments(parseInt(watchFromRepId));
        
        // Transform to display format
        const territories = assignments.map(a => ({
          zipCode: a.ZipCode,
          // In a real app, we would need to fetch county data for these ZIP codes
          countyName: getCountyForZip(a.ZipCode),
        }));
        
        setCurrentTerritories(territories);
        
        // Extract unique counties for the multi-select
        const uniqueCounties = [...new Set(territories.map(t => t.countyName).filter(Boolean))];
        setAvailableCounties(uniqueCounties.map(county => ({ 
          value: county || "", 
          label: county || "" 
        })));
      } catch (error) {
        showError("Failed to load current territories");
        console.error("Error loading current territories:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadCurrentTerritories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchFromRepId]);
  
  // Helper function to get county for a ZIP code (simplified mock)
  const getCountyForZip = (zipCode: string): string => {
    // This is a simplified mock mapping
    const zipToCounty: Record<string, string> = {
      "80019": "Adams",
      "80022": "Adams",
      "80024": "Adams",
      "80030": "Adams",
      "80031": "Adams",
      "80301": "Boulder",
      "80302": "Boulder",
      "80303": "Boulder",
      "80037": "Adams",
      "80045": "Adams",
    };
    
    return zipToCounty[zipCode] || "Unknown";
  };
  
  // Handle mode toggle
  const handleModeChange = (value: string) => {
    const mode = value as ReassignmentMode;
    setValue("mode", mode);
    
    // Reset the fields for the other mode
    if (mode === "county") {
      setValue("zipFrom", "");
      setValue("zipTo", "");
    } else {
      setValue("counties", []);
    }
  };
  
  // Handle form submission
  const onSubmit = async (data: ReassignmentFormValues) => {
    setLoading(true);
    
    try {
      // Prepare the reassignment request
      const reassignRequest = {
        typeId: parseInt(data.typeId),
        fromRepId: parseInt(data.fromRepId),
        toRepId: parseInt(data.toRepId),
        ...(data.mode === "county" ? { counties: data.counties } : { zipFrom: data.zipFrom, zipTo: data.zipTo }),
      };
      
      // In a real application, we would validate if these territories belong to the from rep
      // For the prototype, we'll simulate this check
      if (data.mode === "zip") {
        const zipFrom = parseInt(data.zipFrom || "0");
        const zipTo = parseInt(data.zipTo || "0");
        
        // Check if all ZIPs in the range are assigned to the fromRep
        let allZipsValid = true;
        const invalidZips: string[] = [];
        
        for (let zip = zipFrom; zip <= zipTo; zip++) {
          const zipCode = zip.toString().padStart(5, "0");
          const isAssigned = currentTerritories.some(t => t.zipCode === zipCode);
          
          if (!isAssigned) {
            allZipsValid = false;
            invalidZips.push(zipCode);
          }
        }
        
        if (!allZipsValid) {
          showError(`Some ZIPs are not assigned to the selected rep: ${invalidZips.join(", ")}`);
          setLoading(false);
          return;
        }
      }
      
      // Add the reassignment to the service's staging
      service.addReassign(reassignRequest);
      
      // Find rep names for display
      const fromRepName = fromSalesReps.find(r => r.value === data.fromRepId)?.label || "Unknown";
      const toRepName = toSalesReps.find(r => r.value === data.toRepId)?.label || "Unknown";
      
      // Add to displayed reassignments
      if (data.mode === "county") {
        // Add each county as a separate row
        data.counties?.forEach(county => {
          setReassignments(prev => [
            ...prev,
            {
              id: Date.now() + Math.random(), // Use a unique ID
              typeId: parseInt(data.typeId),
              typeName: selectedRepType || "",
              fromRepId: parseInt(data.fromRepId),
              fromRepName,
              toRepId: parseInt(data.toRepId),
              toRepName,
              location: county,
            },
          ]);
        });
      } else {
        // For ZIP range, create entries for each ZIP
        const zipFrom = parseInt(data.zipFrom || "0");
        const zipTo = parseInt(data.zipTo || "0");
        
        for (let zip = zipFrom; zip <= zipTo; zip++) {
          const zipCode = zip.toString().padStart(5, "0");
          setReassignments(prev => [
            ...prev,
            {
              id: Date.now() + Math.random(), // Use a unique ID
              typeId: parseInt(data.typeId),
              typeName: selectedRepType || "",
              fromRepId: parseInt(data.fromRepId),
              fromRepName,
              toRepId: parseInt(data.toRepId),
              toRepName,
              location: zipCode,
            },
          ]);
        }
      }
      
      // Reset form fields partially (keep the dropdowns)
      if (data.mode === "county") {
        setValue("counties", []);
      } else {
        setValue("zipFrom", "");
        setValue("zipTo", "");
      }
      
      showSuccess("Reassignment added successfully");
    } catch (error) {
      showError("Failed to add reassignment");
      console.error("Error adding reassignment:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle removal of a reassignment from the preview
  const handleRemoveReassignment = (item: ReassignmentDisplay) => {
    setReassignments(prev => prev.filter(r => r.id !== item.id));
    
    // Also remove from service staging (find by matching properties)
    const serviceReassigns = service.reassigns;
    const indexToRemove = serviceReassigns.findIndex(r => 
      r.typeId === item.typeId && 
      r.fromRepId === item.fromRepId && 
      r.toRepId === item.toRepId && 
      (r.counties?.includes(item.location) || r.zipFrom === item.location || r.zipTo === item.location)
    );
    
    if (indexToRemove >= 0) {
      service.removeReassign(indexToRemove);
    }
  };
  
  // Handle batch submission
  const handleConfirmSubmit = async () => {
    setLoading(true);
    
    try {
      // Submit the batched changes
      const result = await service.batchUpdate({
        assigns: service.assigns,
        reassigns: service.reassigns,
      });
      
      if (result.success) {
        showSuccess("Reassignments applied successfully");
        setReassignments([]);
        reset();
      } else {
        showError("Failed to apply reassignments");
      }
    } catch (error) {
      showError("An error occurred while applying reassignments");
      console.error("Error applying reassignments:", error);
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };
  
  // Group current territories by county for display
  const territoriesByCounty = React.useMemo(() => {
    const byCounty: Record<string, number> = {};
    
    currentTerritories.forEach(territory => {
      const county = territory.countyName || "Unknown";
      byCounty[county] = (byCounty[county] || 0) + 1;
    });
    
    return byCounty;
  }, [currentTerritories]);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Reassign Territories</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Rep Type Dropdown */}
                    <FormField
                      control={form.control}
                      name="typeId"
                      render={({ field }) => (
                        <Dropdown
                          label="From Rep Type"
                          options={repTypes}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select Rep Type"
                          required={true}
                          error={form.formState.errors.typeId?.message}
                        />
                      )}
                    />
                    
                    {/* From Sales Rep Dropdown */}
                    <FormField
                      control={form.control}
                      name="fromRepId"
                      render={({ field }) => (
                        <Dropdown
                          label="From Sales Rep"
                          options={fromSalesReps}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select Sales Rep"
                          disabled={!watchTypeId}
                          required={true}
                          error={form.formState.errors.fromRepId?.message}
                        />
                      )}
                    />
                    
                    {/* To Sales Rep Dropdown */}
                    <FormField
                      control={form.control}
                      name="toRepId"
                      render={({ field }) => (
                        <Dropdown
                          label="To Sales Rep"
                          options={toSalesReps}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select Sales Rep"
                          disabled={!watchFromRepId}
                          required={true}
                          error={form.formState.errors.toRepId?.message}
                        />
                      )}
                    />
                  </div>
                  
                  {/* Rep's Current Territories */}
                  <div className="space-y-2">
                    <FormLabel>Rep's Current Territories</FormLabel>
                    <div className="p-3 border border-gray-200 rounded-md bg-muted min-h-[50px]">
                      {currentTerritories.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                          Select a Sales Rep to view their current territories
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(territoriesByCounty).map(([county, count]) => (
                            <Badge key={county} variant="secondary">
                              {county} ({count} ZIP{count !== 1 ? 's' : ''})
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Reassignment Mode Toggle */}
                  <div className="space-y-2">
                    <FormLabel>Reassignment Mode</FormLabel>
                    <FormField
                      control={form.control}
                      name="mode"
                      render={({ field }) => (
                        <ToggleGroup
                          type="single"
                          value={field.value}
                          onValueChange={value => {
                            if (value) handleModeChange(value);
                          }}
                          className="justify-start"
                        >
                          <ToggleGroupItem value="county">By County</ToggleGroupItem>
                          <ToggleGroupItem value="zip">By ZIP Code Range</ToggleGroupItem>
                        </ToggleGroup>
                      )}
                    />
                  </div>
                  
                  {/* County Selection */}
                  {watchMode === "county" && (
                    <FormField
                      control={form.control}
                      name="counties"
                      render={({ field }) => (
                        <MultiSelect
                          label="Counties to Reassign"
                          options={availableCounties}
                          selected={field.value || []}
                          onChange={field.onChange}
                          searchPlaceholder="Search counties..."
                          required={true}
                          disabled={availableCounties.length === 0}
                          error={form.formState.errors.counties?.message}
                        />
                      )}
                    />
                  )}
                  
                  {/* ZIP Code Range */}
                  {watchMode === "zip" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="zipFrom"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP From <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g. 80010"
                                maxLength={5}
                                pattern="[0-9]{5}"
                                onChange={e => {
                                  // Only allow numeric input and limit to 5 digits
                                  const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zipTo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP To <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="e.g. 80020"
                                maxLength={5}
                                pattern="[0-9]{5}"
                                onChange={e => {
                                  // Only allow numeric input and limit to 5 digits
                                  const value = e.target.value.replace(/\D/g, "").slice(0, 5);
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={loading || !form.formState.isValid || !watchFromRepId || !watchTypeId}
                      className="flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      Add Reassignment
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Preview Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Reassignments</CardTitle>
            </CardHeader>
            <CardContent>
              <PreviewTable
                columns={columns}
                data={reassignments}
                onRemove={handleRemoveReassignment}
                emptyMessage="No pending reassignments. Use the form above to add reassignments."
              />
              
              <div className="flex justify-end mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={reassignments.length === 0}
                >
                  Review Changes
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Confirmation Dialog */}
          <ConfirmDialog
            isOpen={showConfirmDialog}
            onClose={() => setShowConfirmDialog(false)}
            onConfirm={handleConfirmSubmit}
            title="Confirm Changes"
            confirmText="Confirm All"
          >
            <div className="space-y-4">
              <p>Review the following changes before confirming:</p>
              
              <div className="bg-muted p-3 rounded-md">
                <h4 className="font-medium mb-2">New Assignments:</h4>
                <ul className="list-disc list-inside mb-3 text-sm">
                  <li>No new assignments</li>
                </ul>
                
                <h4 className="font-medium mb-2">Reassignments:</h4>
                <ul className="list-disc list-inside text-sm">
                  {reassignments.length === 0 ? (
                    <li>No reassignments</li>
                  ) : (
                    // Group by from/to rep pair
                    Object.entries(
                      reassignments.reduce((acc, curr) => {
                        const key = `${curr.fromRepName} → ${curr.toRepName}`;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(curr);
                        return acc;
                      }, {} as Record<string, ReassignmentDisplay[]>)
                    ).map(([repPair, items]) => (
                      <li key={repPair}>{repPair}: {items.length} location(s)</li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </ConfirmDialog>
        </div>
      </main>
    </div>
  );
}
