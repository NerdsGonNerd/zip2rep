import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { Navbar } from "@/components/layout/navbar";
import { Dropdown, DropdownOption } from "@/components/shared/dropdown";
import { MultiSelect, MultiSelectOption } from "@/components/shared/multi-select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PreviewTable, TableColumn } from "@/components/shared/preview-table";
import { useAssignment } from "@/context/assignment-context";
import { useToastService } from "@/components/shared/toast-service";

// Assignment mode type
type AssignmentMode = "county" | "zip";

// Schema for the assignment form
const assignmentFormSchema = z.object({
  typeId: z.string().min(1, "Rep Type is required"),
  repId: z.string().min(1, "Sales Rep is required"),
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

type AssignmentFormValues = z.infer<typeof assignmentFormSchema>;

// Interface for displayed assignments in the table
interface AssignmentDisplay {
  id: number;
  typeId: number;
  typeName: string;
  repId: number;
  repName: string;
  location: string;
}

export default function Assign() {
  const { service, loading, setLoading } = useAssignment();
  const { showSuccess, showError } = useToastService();
  
  // State for UI data
  const [repTypes, setRepTypes] = React.useState<DropdownOption[]>([]);
  const [salesReps, setSalesReps] = React.useState<DropdownOption[]>([]);
  const [counties, setCounties] = React.useState<MultiSelectOption[]>([]);
  const [selectedRepType, setSelectedRepType] = React.useState<string | undefined>();
  const [assignments, setAssignments] = React.useState<AssignmentDisplay[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  
  // Setup form with default values
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      typeId: "",
      repId: "",
      mode: "county",
      counties: [],
      zipFrom: "",
      zipTo: "",
    },
  });
  
  const { watch, setValue, reset } = form;
  const watchMode = watch("mode");
  const watchTypeId = watch("typeId");
  
  // Table columns for the preview
  const columns: TableColumn[] = [
    { header: "Type", accessor: "typeName" },
    { header: "Rep", accessor: "repName" },
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
  
  // Load counties on component mount
  React.useEffect(() => {
    async function loadCounties() {
      setLoading(true);
      try {
        const countiesData = await service.getCounties();
        setCounties(countiesData.map(county => ({ 
          value: county.CountyName, 
          label: county.CountyName 
        })));
      } catch (error) {
        showError("Failed to load counties");
        console.error("Error loading counties:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadCounties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Load sales reps when rep type changes
  React.useEffect(() => {
    if (!watchTypeId) {
      setSalesReps([]);
      setValue("repId", "");
      return;
    }
    
    async function loadSalesReps() {
      setLoading(true);
      try {
        const reps = await service.getSalesReps(parseInt(watchTypeId));
        setSalesReps(reps.map(rep => ({ 
          value: rep.SalesRepId.toString(), 
          label: `${rep.SalesRepNo} (${rep.Division})` 
        })));
        
        // Set the selected rep type for reference
        setSelectedRepType(repTypes.find(t => t.value === watchTypeId)?.label);
        
        // Reset rep selection
        setValue("repId", "");
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
  
  // Handle mode toggle
  const handleModeChange = (value: string) => {
    const mode = value as AssignmentMode;
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
  const onSubmit = async (data: AssignmentFormValues) => {
    setLoading(true);
    
    try {
      // Prepare the assignment request
      const assignRequest = {
        typeId: parseInt(data.typeId),
        repId: parseInt(data.repId),
        ...(data.mode === "county" ? { counties: data.counties } : { zipFrom: data.zipFrom, zipTo: data.zipTo }),
      };
      
      // Validate the assignment
      const validationResult = await service.validate(assignRequest);
      
      if (!validationResult.valid) {
        showError(validationResult.errors.join(", "));
        return;
      }
      
      // Add the assignment to the service's staging
      service.addAssign(assignRequest);
      
      // Find rep name for display
      const repName = salesReps.find(r => r.value === data.repId)?.label || "Unknown";
      
      // Add to displayed assignments
      if (data.mode === "county") {
        // Add each county as a separate row
        data.counties?.forEach(county => {
          setAssignments(prev => [
            ...prev,
            {
              id: Date.now() + Math.random(), // Use a unique ID
              typeId: parseInt(data.typeId),
              typeName: selectedRepType || "",
              repId: parseInt(data.repId),
              repName,
              location: county,
            },
          ]);
        });
      } else {
        // For ZIP range, create a range description
        const zipFrom = parseInt(data.zipFrom || "0");
        const zipTo = parseInt(data.zipTo || "0");
        
        // Create entries for each ZIP in the range
        for (let zip = zipFrom; zip <= zipTo; zip++) {
          const zipCode = zip.toString().padStart(5, "0");
          setAssignments(prev => [
            ...prev,
            {
              id: Date.now() + Math.random(), // Use a unique ID
              typeId: parseInt(data.typeId),
              typeName: selectedRepType || "",
              repId: parseInt(data.repId),
              repName,
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
      
      showSuccess("Assignment added successfully");
    } catch (error) {
      showError("Failed to add assignment");
      console.error("Error adding assignment:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle removal of an assignment from the preview
  const handleRemoveAssignment = (item: AssignmentDisplay) => {
    setAssignments(prev => prev.filter(a => a.id !== item.id));
    
    // Also remove from service staging (find by matching properties)
    const serviceAssigns = service.assigns;
    const indexToRemove = serviceAssigns.findIndex(a => 
      a.typeId === item.typeId && 
      a.repId === item.repId && 
      (a.counties?.includes(item.location) || a.zipFrom === item.location || a.zipTo === item.location)
    );
    
    if (indexToRemove >= 0) {
      service.removeAssign(indexToRemove);
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
        showSuccess("Assignments applied successfully");
        setAssignments([]);
        reset();
      } else {
        showError("Failed to apply assignments");
      }
    } catch (error) {
      showError("An error occurred while applying assignments");
      console.error("Error applying assignments:", error);
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };
  
  // Check if selected rep type and rep are the same as in staged assignments
  const validateAddForm = () => {
    return form.formState.isValid;
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Assign Territories</CardTitle>
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
                          label="Rep Type"
                          options={repTypes}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select Rep Type"
                          required={true}
                          error={form.formState.errors.typeId?.message}
                        />
                      )}
                    />
                    
                    {/* Sales Rep Dropdown */}
                    <FormField
                      control={form.control}
                      name="repId"
                      render={({ field }) => (
                        <Dropdown
                          label="Sales Rep"
                          options={salesReps}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select Sales Rep"
                          disabled={!watchTypeId}
                          required={true}
                          error={form.formState.errors.repId?.message}
                        />
                      )}
                    />
                  </div>
                  
                  {/* Assignment Mode Toggle */}
                  <div className="space-y-2">
                    <FormLabel>Assignment Mode</FormLabel>
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
                          label="Counties"
                          options={counties}
                          selected={field.value || []}
                          onChange={field.onChange}
                          searchPlaceholder="Search counties..."
                          required={true}
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
                      disabled={loading || !validateAddForm()}
                      className="flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      Add
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          {/* Preview Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <PreviewTable
                columns={columns}
                data={assignments}
                onRemove={handleRemoveAssignment}
                emptyMessage="No pending assignments. Use the form above to add assignments."
              />
              
              <div className="flex justify-end mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={assignments.length === 0}
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
                  {assignments.length === 0 ? (
                    <li>No new assignments</li>
                  ) : (
                    // Group by rep
                    Object.entries(
                      assignments.reduce((acc, curr) => {
                        const key = curr.repName;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(curr);
                        return acc;
                      }, {} as Record<string, AssignmentDisplay[]>)
                    ).map(([repName, items]) => (
                      <li key={repName}>{repName}: {items.length} location(s)</li>
                    ))
                  )}
                </ul>
                
                <h4 className="font-medium mb-2">Reassignments:</h4>
                <ul className="list-disc list-inside text-sm">
                  <li>No reassignments</li>
                </ul>
              </div>
            </div>
          </ConfirmDialog>
        </div>
      </main>
    </div>
  );
}
